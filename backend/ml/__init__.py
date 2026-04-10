# ML module — exposes lazy-loaded singletons
from ml.demand_predictor import get_predictor
from ml.alternate_medicine import get_finder
from ml.recommender import get_recommender

__all__ = ["get_predictor", "get_finder", "get_recommender"]
