"""
Medicine Recommender
─────────────────────
Uses Apriori association rules (mlxtend) on live transaction data
to recommend medicines frequently bought together.
"""
import os
import logging
import pandas as pd
from mlxtend.preprocessing import TransactionEncoder
from mlxtend.frequent_patterns import apriori, association_rules

logger = logging.getLogger(__name__)


class MedicineRecommender:
    def __init__(self, min_support: float = 0.2, min_confidence: float = 0.5):
        self.min_support = min_support
        self.min_confidence = min_confidence
        self.transactions: list[list[str]] = []
        self.df: pd.DataFrame | None = None
        self.rules: pd.DataFrame | None = None
        self._trained = False

    def load_data(self):
        from database.db import db
        from models.sales import SaleItem
        from models.medicine import Medicine
        from collections import defaultdict

        # Fetch all sale items linked to their medicine names in one efficient query
        query = db.session.query(
            SaleItem.sale_id,
            Medicine.name
        ).join(Medicine, SaleItem.medicine_id == Medicine.id).all()

        transaction_dict = defaultdict(list)
        for sale_id, med_name in query:
            if med_name:
                transaction_dict[sale_id].append(med_name.strip())

        self.transactions = list(transaction_dict.values())

    def preprocess(self):
        if not self.transactions:
            self.df = pd.DataFrame()
            return
            
        te = TransactionEncoder()
        te_array = te.fit(self.transactions).transform(self.transactions)
        self.df = pd.DataFrame(te_array, columns=te.columns_)

    def train(self):
        self.load_data()
        self.preprocess()
        
        if self.df is None or self.df.empty:
            logger.warning("No transactions found to train recommender.")
            self.rules = pd.DataFrame()
            self._trained = False
            return

        frequent_itemsets = apriori(
            self.df, min_support=self.min_support, use_colnames=True
        )

        if frequent_itemsets.empty:
            logger.warning("No frequent itemsets found — lowering support threshold.")
            frequent_itemsets = apriori(self.df, min_support=0.1, use_colnames=True)

        if frequent_itemsets.empty:
            self.rules = pd.DataFrame()
            self._trained = False
            return

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
        
        if self.rules is None or self.rules.empty:
            return {
                "medicine": medicine_name,
                "recommendations": [],
                "count": 0,
                "model_info": {
                    "min_support": self.min_support,
                    "min_confidence": self.min_confidence,
                    "total_rules": 0,
                    "status": "Insufficient live transaction data to form rules."
                },
            }

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
        if self.df is None or self.df.empty:
            self.load_data()
            self.preprocess()
        return sorted(self.df.columns.tolist()) if self.df is not None and not self.df.empty else []


# Singleton
_recommender: MedicineRecommender | None = None


def get_recommender() -> MedicineRecommender:
    global _recommender
    if _recommender is None:
        _recommender = MedicineRecommender()
        _recommender.train()
    # It's an unsupervised model so it doesn't take params like branch_id
    # but we could call _recommender.train() to force refresh with latest db if desired.
    return _recommender
