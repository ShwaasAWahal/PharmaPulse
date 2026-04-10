"""
Demand Predictor
────────────────
Linear Regression model that predicts future medicine sales
based on historical sales_data.csv.

Original notebook: Sales_prediction.ipynb
"""
import os
import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DEFAULT_DATA_PATH = os.path.join(BASE_DIR, "sales_data.csv")


class DemandPredictor:
    def __init__(self, file_path: str = DEFAULT_DATA_PATH):
        self.file_path = file_path
        self.model = LinearRegression()
        self.data = None
        self._trained = False

    def load_data(self):
        self.data = pd.read_csv(self.file_path)
        self.data.columns = self.data.columns.str.strip().str.lower()

        if "date" not in self.data.columns or "sales" not in self.data.columns:
            raise ValueError("CSV must contain 'date' and 'sales' columns.")

    def preprocess(self):
        self.data["date"] = pd.to_datetime(self.data["date"], errors="coerce")
        self.data = self.data.dropna(subset=["date", "sales"])
        self.data["days"] = (self.data["date"] - self.data["date"].min()).dt.days

    def train(self):
        if self.data is None:
            self.load_data()
        self.preprocess()
        X = self.data[["days"]]
        y = self.data["sales"]
        self.model.fit(X, y)
        self._trained = True

    def predict_next_n_days(self, n: int = 30) -> list[dict]:
        if not self._trained:
            self.train()

        last_day = int(self.data["days"].max())
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
        return {
            "model": "LinearRegression",
            "training_samples": len(self.data),
            "date_range": {
                "from": str(self.data["date"].min().date()),
                "to": str(self.data["date"].max().date()),
            },
            "coefficient": round(float(self.model.coef_[0]), 6),
            "intercept": round(float(self.model.intercept_), 6),
        }


# Singleton — loaded once per process
_predictor: DemandPredictor | None = None


def get_predictor() -> DemandPredictor:
    global _predictor
    if _predictor is None:
        _predictor = DemandPredictor()
        _predictor.train()
    return _predictor
