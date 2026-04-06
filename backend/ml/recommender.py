"""
Medicine Recommender
─────────────────────
Uses Apriori association rules (mlxtend) on transaction data
to recommend medicines frequently bought together.

Original notebook: Recommadation.ipynb
"""
import os
import logging
import pandas as pd
from mlxtend.preprocessing import TransactionEncoder
from mlxtend.frequent_patterns import apriori, association_rules

logger = logging.getLogger(__name__)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DEFAULT_DATA_PATH = os.path.join(BASE_DIR, "transactions.csv")


class MedicineRecommender:
    def __init__(self, file_path: str = DEFAULT_DATA_PATH,
                 min_support: float = 0.2,
                 min_confidence: float = 0.5):
        self.file_path = file_path
        self.min_support = min_support
        self.min_confidence = min_confidence
        self.transactions: list[list[str]] = []
        self.df: pd.DataFrame | None = None
        self.rules: pd.DataFrame | None = None
        self._trained = False

    def load_data(self):
        data = pd.read_csv(self.file_path)
        self.transactions = (
            data["items"].apply(lambda x: [i.strip() for i in x.split("|")]).tolist()
        )

    def preprocess(self):
        te = TransactionEncoder()
        te_array = te.fit(self.transactions).transform(self.transactions)
        self.df = pd.DataFrame(te_array, columns=te.columns_)

    def train(self):
        if not self.transactions:
            self.load_data()
        self.preprocess()

        frequent_itemsets = apriori(
            self.df, min_support=self.min_support, use_colnames=True
        )

        if frequent_itemsets.empty:
            logger.warning("No frequent itemsets found — lowering support threshold.")
            frequent_itemsets = apriori(self.df, min_support=0.1, use_colnames=True)

        self.rules = association_rules(
            frequent_itemsets, metric="confidence", min_threshold=self.min_confidence
        )
        self._trained = True
        logger.info(f"Recommender trained: {len(self.rules)} association rules generated.")

    def get_recommendations(self, medicine_name: str) -> dict:
        if not self._trained:
            self.train()

        medicine_name = medicine_name.strip()
        recommendations = set()

        for _, row in self.rules.iterrows():
            antecedents = set(row["antecedents"])
            consequents = set(row["consequents"])

            if medicine_name in antecedents:
                recommendations.update(consequents)
            if medicine_name in consequents:
                recommendations.update(antecedents)

        recommendations.discard(medicine_name)

        # Build enriched result with confidence scores
        enriched = []
        for rec in recommendations:
            # Find the best confidence rule for this recommendation
            best_conf = 0.0
            best_support = 0.0
            for _, row in self.rules.iterrows():
                if rec in row["consequents"] and medicine_name in row["antecedents"]:
                    if row["confidence"] > best_conf:
                        best_conf = row["confidence"]
                        best_support = row["support"]
            enriched.append({
                "medicine": rec,
                "confidence": round(float(best_conf), 3),
                "support": round(float(best_support), 3),
            })

        enriched.sort(key=lambda x: x["confidence"], reverse=True)

        return {
            "medicine": medicine_name,
            "recommendations": enriched,
            "count": len(enriched),
            "model_info": {
                "min_support": self.min_support,
                "min_confidence": self.min_confidence,
                "total_rules": len(self.rules),
            },
        }

    def get_all_known_medicines(self) -> list[str]:
        """Return all medicine names present in the transaction dataset."""
        if self.df is None:
            self.load_data()
            self.preprocess()
        return sorted(self.df.columns.tolist())


# Singleton
_recommender: MedicineRecommender | None = None


def get_recommender() -> MedicineRecommender:
    global _recommender
    if _recommender is None:
        _recommender = MedicineRecommender()
        _recommender.train()
    return _recommender
