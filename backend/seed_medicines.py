"""
seed_medicines.py
──────────────────
Bulk-imports medicines from final_medicine_dataset.csv into the
medicines and suppliers tables.

Usage:
    python seed_medicines.py                        # import all (274k rows)
    python seed_medicines.py --limit 5000           # import first N rows
    python seed_medicines.py --limit 5000 --reset   # wipe existing first

Options:
    --limit N      Only import the first N medicines (good for dev/testing)
    --reset        Delete all existing medicines + suppliers before importing
    --csv PATH     Path to CSV file (default: ml/final_medicine_dataset.csv)
    --batch N      DB commit batch size (default: 500)
"""

import os
import sys
import csv
import argparse
import time

# ── Make sure we can import app modules ──────────────────────────────────────
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app
from database.db import db
from models.medicine import Medicine
from models.supplier import Supplier

# ── Helpers ───────────────────────────────────────────────────────────────────

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DEFAULT_CSV = os.path.join(BASE_DIR, "ml", "final_medicine_dataset.csv")


def detect_form(pack_size_label: str) -> str:
    """Infer dosage form from the pack_size_label field."""
    label = pack_size_label.lower()
    if "tablet" in label:
        return "Tablet"
    if "capsule" in label:
        return "Capsule"
    if "syrup" in label or "liquid" in label or "suspension" in label:
        return "Syrup"
    if "injection" in label or "infusion" in label or "vial" in label:
        return "Injection"
    if "cream" in label or "ointment" in label or "gel" in label:
        return "Cream/Ointment"
    if "drop" in label:
        return "Drops"
    if "inhaler" in label or "rotacap" in label or "respule" in label:
        return "Inhaler"
    if "solution" in label:
        return "Solution"
    if "lotion" in label or "shampoo" in label:
        return "Lotion"
    if "powder" in label or "sachet" in label:
        return "Powder/Sachet"
    if "patch" in label or "strip" in label:
        return "Patch"
    return "Other"


def extract_strength(composition: str) -> str:
    """Pull the first strength value out of a composition string."""
    import re
    if not composition:
        return ""
    match = re.search(r"\(([^)]+)\)", composition)
    return match.group(1).strip() if match else ""


def detect_category(composition: str, form: str) -> str:
    """Best-effort category from composition keywords."""
    comp = (composition or "").lower()
    if any(k in comp for k in ["amoxycillin", "azithromycin", "ciprofloxacin", "clavulanic"]):
        return "Antibiotic"
    if any(k in comp for k in ["paracetamol", "ibuprofen", "diclofenac", "aspirin", "naproxen"]):
        return "Analgesic/Antipyretic"
    if any(k in comp for k in ["amlodipine", "atenolol", "losartan", "telmisartan", "ramipril"]):
        return "Cardiovascular"
    if any(k in comp for k in ["metformin", "glipizide", "insulin", "glimepiride", "sitagliptin"]):
        return "Antidiabetic"
    if any(k in comp for k in ["omeprazole", "pantoprazole", "ranitidine", "esomeprazole"]):
        return "Gastrointestinal"
    if any(k in comp for k in ["cetirizine", "fexofenadine", "loratadine", "chlorpheniramine"]):
        return "Antihistamine"
    if any(k in comp for k in ["vitamin", "zinc", "calcium", "iron", "folic"]):
        return "Vitamins/Supplements"
    if any(k in comp for k in ["salbutamol", "budesonide", "montelukast", "levosalbutamol"]):
        return "Respiratory"
    if any(k in comp for k in ["fluconazole", "clotrimazole", "terbinafine"]):
        return "Antifungal"
    if any(k in comp for k in ["metronidazole", "tinidazole", "albendazole"]):
        return "Antiparasitic"
    if form in ("Cream/Ointment", "Lotion"):
        return "Dermatology"
    if form in ("Drops",):
        return "Ophthalmic/ENT"
    if form in ("Injection",):
        return "Injectable"
    return "General"


def safe_float(value, default=0.0) -> float:
    try:
        return float(value)
    except (ValueError, TypeError):
        return default


def compute_selling_price(mrp: float) -> float:
    """Selling price = MRP minus a 15% retail margin."""
    return round(mrp * 0.85, 2)


def compute_purchase_price(mrp: float) -> float:
    """Purchase price = MRP minus a 30% distributor margin."""
    return round(mrp * 0.70, 2)


# ── Main seeder ───────────────────────────────────────────────────────────────

def seed_medicines(csv_path: str, limit: int | None, reset: bool, batch_size: int):
    app = create_app()

    with app.app_context():
        if reset:
            print("⚠️  --reset flag set: deleting all existing medicines and suppliers...")
            db.session.query(Medicine).delete()
            db.session.query(Supplier).delete()
            db.session.commit()
            print("   Done.\n")

        # ── Load existing barcodes/names to skip duplicates ──────────────────
        existing_names = set(
            r[0].lower() for r in db.session.query(Medicine.name).all()
        )
        print(f"📦 Existing medicines in DB: {len(existing_names)}")

        # ── Cache suppliers by manufacturer name ─────────────────────────────
        supplier_cache: dict[str, int] = {
            s.name: s.id for s in Supplier.query.all()
        }

        # ── Open CSV ──────────────────────────────────────────────────────────
        if not os.path.exists(csv_path):
            print(f"❌ CSV not found: {csv_path}")
            sys.exit(1)

        with open(csv_path, encoding="utf-8") as f:
            reader = csv.DictReader(f)
            rows = list(reader)

        total_rows = len(rows)
        if limit:
            rows = rows[:limit]

        print(f"📄 CSV rows total: {total_rows:,}  |  Importing: {len(rows):,}\n")

        inserted = 0
        skipped = 0
        batch_count = 0
        start = time.time()

        medicines_batch = []

        for idx, row in enumerate(rows, 1):
            name = row["name"].strip().title()

            # Skip duplicates
            if name.lower() in existing_names:
                skipped += 1
                continue

            # ── Supplier / manufacturer ───────────────────────────────────────
            manufacturer = row.get("manufacturer_name", "").strip()
            supplier_id = None
            if manufacturer:
                if manufacturer not in supplier_cache:
                    supplier = Supplier(
                        name=manufacturer,
                        is_active=True,
                    )
                    db.session.add(supplier)
                    db.session.flush()   # get supplier.id before commit
                    supplier_cache[manufacturer] = supplier.id
                supplier_id = supplier_cache[manufacturer]

            # ── Parse fields ──────────────────────────────────────────────────
            pack_label   = row.get("pack_size_label", "").strip()
            composition1 = row.get("short_composition1", "").strip()
            composition2 = row.get("short_composition2", "").strip()
            composition  = f"{composition1} | {composition2}".strip(" |") if composition2 else composition1

            form         = detect_form(pack_label)
            strength     = extract_strength(composition1)
            category     = detect_category(composition1, form)
            mrp          = safe_float(row.get("price(₹)", 0))
            is_disc      = str(row.get("Is_discontinued", "False")).strip().lower() == "true"

            med = Medicine(
                name=name,
                generic_name=composition1.strip() or None,
                brand=name.split()[0].title() if name else None,
                category=category,
                form=form,
                strength=strength,
                unit="strip" if "strip" in pack_label.lower() else
                      "bottle" if "bottle" in pack_label.lower() else
                      "vial" if "vial" in pack_label.lower() else "unit",
                description=f"{composition} | {pack_label}".strip(" |"),
                requires_prescription=form in ("Injection", "Inhaler"),
                tax_percent=12.0 if form == "Injection" else 5.0,
                mrp=mrp if mrp > 0 else None,
                purchase_price=compute_purchase_price(mrp) if mrp > 0 else 0.0,
                selling_price=compute_selling_price(mrp) if mrp > 0 else 0.0,
                supplier_id=supplier_id,
                is_active=not is_disc,
            )

            db.session.add(med)
            existing_names.add(name.lower())
            inserted += 1
            batch_count += 1

            # ── Commit in batches ─────────────────────────────────────────────
            if batch_count >= batch_size:
                db.session.commit()
                batch_count = 0
                elapsed = time.time() - start
                pct = (idx / len(rows)) * 100
                rate = inserted / elapsed if elapsed > 0 else 0
                print(f"   ✅ {inserted:>7,} inserted | {skipped:>6,} skipped | "
                      f"{pct:5.1f}% done | {rate:.0f} rows/sec", end="\r")

        # Final commit
        if batch_count > 0:
            db.session.commit()

        elapsed = time.time() - start
        print(f"\n\n{'─'*55}")
        print(f"  ✅ Medicines inserted : {inserted:,}")
        print(f"  ⏭️  Skipped (dupes)   : {skipped:,}")
        print(f"  🏭 Suppliers created  : {len(supplier_cache):,}")
        print(f"  ⏱️  Time taken         : {elapsed:.1f}s")
        print(f"{'─'*55}")
        print("\n🎉 Medicine seeding complete!\n")


# ── CLI ───────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Seed medicines from CSV into the database.")
    parser.add_argument("--csv",   default=DEFAULT_CSV, help="Path to final_medicine_dataset.csv")
    parser.add_argument("--limit", type=int, default=None, help="Max number of rows to import")
    parser.add_argument("--reset", action="store_true",   help="Delete existing data before importing")
    parser.add_argument("--batch", type=int, default=500, help="Commit batch size (default 500)")
    args = parser.parse_args()

    seed_medicines(
        csv_path=args.csv,
        limit=args.limit,
        reset=args.reset,
        batch_size=args.batch,
    )
