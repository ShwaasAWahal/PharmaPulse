"""
Demand Predictor
────────────────
Linear Regression model that predicts future medicine sales
based on live orders from the database.
"""
import os
import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression


class DemandPredictor:
    def __init__(self, medicine_id=None, branch_id=None):
        self.medicine_id = medicine_id
        self.branch_id = branch_id
        self.model = LinearRegression()
        self.data = pd.DataFrame()
        self._trained = False

    def load_data(self):
        from database.db import db
        from models.sales import Sale, SaleItem
        from sqlalchemy import cast, Date, func

        query = db.session.query(
            cast(Sale.created_at, Date).label('date'),
            func.sum(SaleItem.quantity).label('sales')
        ).join(SaleItem, Sale.id == SaleItem.sale_id)

        if self.medicine_id:
            query = query.filter(SaleItem.medicine_id == self.medicine_id)
        if self.branch_id:
            query = query.filter(Sale.branch_id == self.branch_id)

        query = query.group_by(cast(Sale.created_at, Date)).order_by(cast(Sale.created_at, Date))
        
        records = query.all()

        if not records:
            self.data = pd.DataFrame(columns=["date", "sales"])
        else:
            self.data = pd.DataFrame([{"date": r.date, "sales": r.sales} for r in records])

    def preprocess(self):
        if self.data.empty:
            self.data["days"] = []
            return
            
        self.data["date"] = pd.to_datetime(self.data["date"], errors="coerce")
        self.data = self.data.dropna(subset=["date", "sales"])
        
        if not self.data.empty:
            self.data["days"] = (self.data["date"] - self.data["date"].min()).dt.days
        else:
            self.data["days"] = []

    def train(self):
        self.load_data()
        self.preprocess()
        
        if len(self.data) < 2:
            self._trained = False
            self.r2_score = None
            return
            
        X = self.data[["days"]]
        y = self.data["sales"]
        self.model.fit(X, y)
        self.r2_score = self.model.score(X, y)
        self._trained = True

    def predict_next_n_days(self, n: int = 30) -> list[dict]:
        if not self._trained:
            self.train()

        if not self._trained:
            return [{"day": i + 1, "predicted_sales": 0} for i in range(n)]

        last_day = int(self.data["days"].max()) if not self.data.empty else 0
        future_days = np.array(range(last_day + 1, last_day + n + 1)).reshape(-1, 1)
        predictions = self.model.predict(future_days)

        return [
            {"day": i + 1, "predicted_sales": max(0, round(float(pred), 2))}
            for i, pred in enumerate(predictions)
        ]

    def summary(self) -> dict:
        """Return model meta-info."""
        if not self._trained:
            self.train()
            
        if not self._trained:
            return {
                "model": "LinearRegression",
                "training_samples": len(self.data) if not self.data.empty else 0,
                "status": "Insufficient data to train model"
            }
            
        return {
            "model": "LinearRegression",
            "training_samples": len(self.data),
            "r2_score": round(float(self.r2_score), 4) if getattr(self, "r2_score", None) is not None else None,
            "date_range": {
                "from": str(self.data["date"].min().date()) if not self.data.empty else None,
                "to": str(self.data["date"].max().date()) if not self.data.empty else None,
            },
            "coefficient": round(float(self.model.coef_[0]), 6),
            "intercept": round(float(self.model.intercept_), 6),
        }

def get_predictor(medicine_id=None, branch_id=None) -> DemandPredictor:
    predictor = DemandPredictor(medicine_id, branch_id)
    predictor.train()
    return predictor
