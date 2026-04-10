"""
Alternate Medicine Finder
──────────────────────────
Looks up substitute/generic alternatives for a given brand medicine
using the final_medicine_dataset.csv.

Original notebook: Alternate_medicine.ipynb
"""
import os
import pandas as pd

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DEFAULT_DATA_PATH = os.path.join(BASE_DIR, "final_medicine_dataset.csv")


class AlternateMedicineFinder:
    def __init__(self, file_path: str = DEFAULT_DATA_PATH):
        self.file_path = file_path
        self.df: pd.DataFrame | None = None

    def load_data(self):
        self.df = pd.read_csv(self.file_path)
        self.df["name"] = self.df["name"].str.lower().str.strip()

    def get_alternatives(self, medicine_name: str) -> dict:
        if self.df is None:
            self.load_data()

        medicine_name = medicine_name.lower().strip()

        # First try startswith, then fallback to contains
        med = self.df[self.df["name"].str.startswith(medicine_name)]
        if med.empty:
            med = self.df[self.df["name"].str.contains(medicine_name, na=False)]

        if med.empty:
            return {"found": False, "error": f"Medicine '{medicine_name}' not found in dataset."}

        row = med.iloc[0]

        substitute_cols = ["substitute0", "substitute1", "substitute2", "substitute3", "substitute4"]
        alternatives = [
            str(row[col]).strip()
            for col in substitute_cols
            if col in self.df.columns and pd.notna(row[col]) and str(row[col]).strip()
        ]

        return {
            "found": True,
            "medicine": str(row["name"]),
            "price": float(row["price(₹)"]) if pd.notna(row.get("price(₹)")) else None,
            "composition": str(row["short_composition1"]).strip() if pd.notna(row.get("short_composition1")) else None,
            "manufacturer": str(row["manufacturer_name"]).strip() if pd.notna(row.get("manufacturer_name")) else None,
            "type": str(row["type"]).strip() if pd.notna(row.get("type")) else None,
            "pack_size": str(row["pack_size_label"]).strip() if pd.notna(row.get("pack_size_label")) else None,
            "is_discontinued": bool(row["Is_discontinued"]) if pd.notna(row.get("Is_discontinued")) else None,
            "alternatives": alternatives,
            "alternatives_count": len(alternatives),
        }

    def search_medicines(self, query: str, limit: int = 10) -> list[dict]:
        """Search medicines by partial name."""
        if self.df is None:
            self.load_data()

        query = query.lower().strip()
        matches = self.df[self.df["name"].str.contains(query, na=False)].head(limit)

        return [
            {
                "name": str(row["name"]),
                "price": float(row["price(₹)"]) if pd.notna(row.get("price(₹)")) else None,
                "manufacturer": str(row["manufacturer_name"]) if pd.notna(row.get("manufacturer_name")) else None,
                "composition": str(row["short_composition1"]) if pd.notna(row.get("short_composition1")) else None,
            }
            for _, row in matches.iterrows()
        ]


# Singleton
_finder: AlternateMedicineFinder | None = None


def get_finder() -> AlternateMedicineFinder:
    global _finder
    if _finder is None:
        _finder = AlternateMedicineFinder()
        _finder.load_data()
    return _finder
