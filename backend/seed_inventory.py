"""
seed_inventory.py
──────────────────
Generates realistic dummy inventory records for all medicines in the DB.
Each medicine gets 1-3 batches with randomised:
  - Quantities          (realistic ranges per form type)
  - Batch numbers       (formatted like real pharma batches)
  - Expiry dates        (mix of future, near-expiry, and some expired for testing)
  - Manufacture dates   (6-24 months before expiry)
  - Purchase/sell prices (inherited from medicine or slightly varied per batch)
  - Shelf locations     (realistic rack/shelf codes)

Usage:
    python seed_inventory.py                        # all medicines, branch 1
    python seed_inventory.py --branch 1             # specific branch
    python seed_inventory.py --all-branches         # seed for every branch
    python seed_inventory.py --reset                # wipe inventory first
    python seed_inventory.py --limit 1000           # only first N medicines

Options:
    --branch N       Branch ID to seed inventory for (default: 1)
    --all-branches   Seed inventory for all active branches
    --limit N        Only seed inventory for first N medicines
    --reset          Delete all existing inventory before seeding
    --batch N        DB commit batch size (default: 200)
"""

import os
import sys
import random
import string
import argparse
import time
from datetime import date, timedelta

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app
from database.db import db
from models.medicine import Medicine
from models.inventory import Inventory
from models.branch import Branch

# ── Randomisation config ──────────────────────────────────────────────────────

# Realistic quantity ranges by dosage form
QUANTITY_RANGES = {
    "Tablet":          (50,  500),
    "Capsule":         (30,  300),
    "Syrup":           (10,  100),
    "Injection":       (5,   50),
    "Cream/Ointment":  (10,  80),
    "Drops":           (10,  60),
    "Inhaler":         (5,   30),
    "Solution":        (10,  80),
    "Lotion":          (5,   40),
    "Powder/Sachet":   (20,  150),
    "Other":           (10,  100),
}

# Low stock threshold by form
LOW_STOCK_THRESHOLDS = {
    "Tablet":          20,
    "Capsule":         15,
    "Syrup":           5,
    "Injection":       5,
    "Cream/Ointment":  5,
    "Drops":           5,
    "Inhaler":         3,
    "Other":           10,
}

# Shelf location pools
AISLES   = ["A", "B", "C", "D", "E", "F"]
RACKS    = [str(i) for i in range(1, 11)]
SHELVES  = ["Top", "Mid", "Bot"]


# ── Helpers ───────────────────────────────────────────────────────────────────

def random_batch_number(idx: int) -> str:
    """Generate a realistic pharma batch number e.g. BT240731-0042."""
    suffix = random.randint(1, 9999)
    month  = random.randint(1, 12)
    year   = random.randint(23, 26)
    return f"BT{year:02d}{month:02d}-{suffix:04d}"


def random_expiry(profile: str) -> date:
    """
    Generate an expiry date based on a profile:
      'far'     → 6-36 months from today (good stock)
      'near'    → 1-30 days from today  (triggers alerts)
      'expired' → 1-180 days ago        (tests expired stock handling)
    """
    today = date.today()
    if profile == "far":
        days = random.randint(180, 1080)
        return today + timedelta(days=days)
    elif profile == "near":
        days = random.randint(1, 30)
        return today + timedelta(days=days)
    elif profile == "expired":
        days = random.randint(1, 180)
        return today - timedelta(days=days)
    return today + timedelta(days=365)


def random_manufacture_date(expiry: date) -> date:
    """Manufacture date is 12-36 months before expiry."""
    months_before = random.randint(12, 36)
    return expiry - timedelta(days=months_before * 30)


def random_location() -> str:
    return f"{random.choice(AISLES)}{random.choice(RACKS)}-{random.choice(SHELVES)}"


def num_batches_for(form: str) -> int:
    """Most medicines have 1-2 batches; injections/inhalers often just 1."""
    if form in ("Injection", "Inhaler"):
        return random.choices([1, 2], weights=[70, 30])[0]
    return random.choices([1, 2, 3], weights=[40, 45, 15])[0]


def expiry_profile_for(batch_index: int) -> str:
    """
    Distribute expiry profiles so the test data is realistic:
    - 80% good stock
    - 12% near-expiry (triggers alerts)
    -  8% expired (for testing expired-stock reports)
    """
    roll = random.random()
    if roll < 0.08:
        return "expired"
    elif roll < 0.20:
        return "near"
    else:
        return "far"


def price_variation(base_price: float) -> float:
    """Add ±5% batch-level price variation."""
    if base_price <= 0:
        return 0.0
    factor = random.uniform(0.95, 1.05)
    return round(base_price * factor, 2)


# ── Main seeder ───────────────────────────────────────────────────────────────

def seed_inventory(branch_ids: list[int], limit: int | None,
                   reset: bool, batch_size: int):
    app = create_app()

    with app.app_context():

        # ── Validate branches ─────────────────────────────────────────────────
        branches = Branch.query.filter(Branch.id.in_(branch_ids), Branch.is_active == True).all()
        if not branches:
            print(f"❌ No active branches found for IDs: {branch_ids}")
            sys.exit(1)
        print(f"🏪 Seeding inventory for branches: {[b.name for b in branches]}\n")

        if reset:
            print("⚠️  --reset flag: deleting all existing inventory...")
            db.session.query(Inventory).filter(
                Inventory.branch_id.in_([b.id for b in branches])
            ).delete(synchronize_session=False)
            db.session.commit()
            print("   Done.\n")

        # ── Load medicines ────────────────────────────────────────────────────
        med_query = Medicine.query.filter_by(is_active=True)
        if limit:
            med_query = med_query.limit(limit)
        medicines = med_query.all()

        if not medicines:
            print("❌ No active medicines found. Run seed_medicines.py first!")
            sys.exit(1)

        print(f"💊 Medicines to process : {len(medicines):,}")
        print(f"📦 Batches per medicine : 1-3 (randomised)")
        print(f"📊 Expiry split          : ~80% good | ~12% near-expiry | ~8% expired\n")

        # ── Existing batch keys to avoid duplicates ───────────────────────────
        existing = set(
            (r.medicine_id, r.branch_id, r.batch_number)
            for r in db.session.query(
                Inventory.medicine_id, Inventory.branch_id, Inventory.batch_number
            ).all()
        )

        total_inserted = 0
        total_skipped  = 0
        batch_buf      = 0
        start          = time.time()

        for med_idx, med in enumerate(medicines, 1):
            form = med.form or "Other"
            qty_min, qty_max = QUANTITY_RANGES.get(form, (10, 100))
            threshold = LOW_STOCK_THRESHOLDS.get(form, 10)
            num_batches = num_batches_for(form)

            for batch_idx in range(num_batches):
                for branch in branches:
                    batch_no = random_batch_number(med_idx * 100 + batch_idx)
                    key = (med.id, branch.id, batch_no)

                    if key in existing:
                        total_skipped += 1
                        continue

                    profile     = expiry_profile_for(batch_idx)
                    expiry      = random_expiry(profile)
                    manufacture = random_manufacture_date(expiry)
                    quantity    = random.randint(qty_min, qty_max)

                    # Near-expiry and expired items usually have lower quantity
                    if profile in ("near", "expired"):
                        quantity = random.randint(1, max(1, qty_min // 2))

                    inv = Inventory(
                        medicine_id=med.id,
                        branch_id=branch.id,
                        batch_number=batch_no,
                        quantity=quantity,
                        low_stock_threshold=threshold,
                        expiry_date=expiry,
                        manufacture_date=manufacture,
                        purchase_price=price_variation(med.purchase_price),
                        selling_price=price_variation(med.selling_price),
                        location=random_location(),
                        notes=f"Seeded | {profile} batch",
                        is_active=True,
                    )

                    db.session.add(inv)
                    existing.add(key)
                    total_inserted += 1
                    batch_buf += 1

                    if batch_buf >= batch_size:
                        db.session.commit()
                        batch_buf = 0
                        elapsed = time.time() - start
                        pct = (med_idx / len(medicines)) * 100
                        rate = total_inserted / elapsed if elapsed > 0 else 0
                        print(f"   ✅ {total_inserted:>8,} inserted | "
                              f"{pct:5.1f}% done | {rate:.0f} rows/sec", end="\r")

        if batch_buf > 0:
            db.session.commit()

        elapsed = time.time() - start

        # ── Summary ───────────────────────────────────────────────────────────
        print(f"\n\n{'─'*60}")
        print(f"  ✅ Inventory records inserted : {total_inserted:,}")
        print(f"  ⏭️  Skipped (duplicates)      : {total_skipped:,}")
        print(f"  🏪 Branches seeded            : {len(branches)}")
        print(f"  💊 Medicines processed         : {len(medicines):,}")
        print(f"  ⏱️  Time taken                 : {elapsed:.1f}s")
        print(f"{'─'*60}")

        # ── Quick stats ───────────────────────────────────────────────────────
        today = date.today()
        cutoff_30 = today + timedelta(days=30)

        expired_count = db.session.query(Inventory).filter(
            Inventory.expiry_date != None,
            Inventory.expiry_date < today,
            Inventory.quantity > 0,
        ).count()

        near_expiry_count = db.session.query(Inventory).filter(
            Inventory.expiry_date != None,
            Inventory.expiry_date >= today,
            Inventory.expiry_date <= cutoff_30,
            Inventory.quantity > 0,
        ).count()

        low_stock_count = db.session.query(Inventory).filter(
            Inventory.quantity <= Inventory.low_stock_threshold
        ).count()

        print(f"\n  📊 Inventory health snapshot:")
        print(f"     🔴 Expired batches          : {expired_count:,}")
        print(f"     🟡 Expiring within 30 days  : {near_expiry_count:,}")
        print(f"     🟠 Low stock batches         : {low_stock_count:,}")
        print(f"{'─'*60}")
        print("\n🎉 Inventory seeding complete!\n")


# ── CLI ───────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Seed realistic dummy inventory for all medicines."
    )
    parser.add_argument("--branch",      type=int, default=1,
                        help="Branch ID to seed for (default: 1)")
    parser.add_argument("--all-branches", action="store_true",
                        help="Seed inventory for ALL active branches")
    parser.add_argument("--limit",       type=int, default=None,
                        help="Only seed inventory for first N medicines")
    parser.add_argument("--reset",       action="store_true",
                        help="Delete existing inventory before seeding")
    parser.add_argument("--batch",       type=int, default=200,
                        help="DB commit batch size (default: 200)")
    args = parser.parse_args()

    app_tmp = create_app()
    with app_tmp.app_context():
        if args.all_branches:
            branch_ids = [b.id for b in Branch.query.filter_by(is_active=True).all()]
            if not branch_ids:
                print("❌ No active branches found.")
                sys.exit(1)
        else:
            branch_ids = [args.branch]

    seed_inventory(
        branch_ids=branch_ids,
        limit=args.limit,
        reset=args.reset,
        batch_size=args.batch,
    )
