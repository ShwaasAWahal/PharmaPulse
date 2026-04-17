"""
ML Routes
──────────
Real ML-powered endpoints using the models from the ML team's notebooks:
  - Sales_prediction.ipynb   → POST /api/ml/predict-demand
  - Alternate_medicine.ipynb → POST /api/ml/recommend-generic
                               GET  /api/ml/search-medicine
  - Recommadation.ipynb      → POST /api/ml/recommend-together
"""
import logging
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required

logger = logging.getLogger(__name__)
ml_bp = Blueprint("ml", __name__, url_prefix="/api/ml")


def _load_predictor(medicine_id=None, branch_id=None):
    from ml.demand_predictor import get_predictor
    return get_predictor(medicine_id, branch_id)

def _load_finder():
    from ml.alternate_medicine import get_finder
    return get_finder()

def _load_recommender():
    from ml.recommender import get_recommender
    return get_recommender()


@ml_bp.post("/predict-demand")
@jwt_required()
def predict_demand():
    """
    Predict future medicine sales using Linear Regression.
    Body: { horizon_days?: int, medicine_id?: int, branch_id?: int }
    """
    data = request.get_json(silent=True) or {}
    horizon_days = int(data.get("horizon_days", 30))
    medicine_id = data.get("medicine_id")
    branch_id = data.get("branch_id")

    if horizon_days < 1 or horizon_days > 365:
        return jsonify({"success": False, "message": "horizon_days must be between 1 and 365."}), 400

    try:
        predictor = _load_predictor(medicine_id, branch_id)
        predictions = predictor.predict_next_n_days(horizon_days)
        summary = predictor.summary()
        total_predicted = round(sum(p["predicted_sales"] for p in predictions), 2)
        avg_daily = round(total_predicted / horizon_days, 2)

        return jsonify({
            "success": True,
            "medicine_id": data.get("medicine_id"),
            "branch_id": data.get("branch_id"),
            "horizon_days": horizon_days,
            "total_predicted_sales": total_predicted,
            "avg_daily_sales": avg_daily,
            "predictions": predictions,
            "model_info": summary,
        }), 200
    except Exception as e:
        logger.error(f"Demand prediction error: {e}", exc_info=True)
        return jsonify({"success": False, "message": str(e)}), 500


@ml_bp.post("/recommend-generic")
@jwt_required()
def recommend_generic():
    """
    Find generic/substitute alternatives for a branded medicine.
    Body: { brand_medicine_name: str }
    """
    data = request.get_json(silent=True) or {}
    brand_name = (data.get("brand_medicine_name") or "").strip()

    if not brand_name:
        return jsonify({"success": False, "message": "brand_medicine_name is required."}), 400

    try:
        finder = _load_finder()
        result = finder.get_alternatives(brand_name)
        if not result.get("found"):
            return jsonify({"success": False, "message": result.get("error")}), 404
        return jsonify({"success": True, "result": result}), 200
    except Exception as e:
        logger.error(f"Generic recommendation error: {e}", exc_info=True)
        return jsonify({"success": False, "message": str(e)}), 500


@ml_bp.get("/search-medicine")
@jwt_required()
def search_medicine():
    """
    Search the medicine dataset by partial name.
    Query params: q, limit (default 10)
    """
    query = request.args.get("q", "").strip()
    limit = min(request.args.get("limit", 10, type=int), 50)

    if not query or len(query) < 2:
        return jsonify({"success": False, "message": "Query 'q' must be at least 2 characters."}), 400

    try:
        finder = _load_finder()
        results = finder.search_medicines(query, limit=limit)
        return jsonify({"success": True, "count": len(results), "medicines": results}), 200
    except Exception as e:
        logger.error(f"Medicine search error: {e}", exc_info=True)
        return jsonify({"success": False, "message": str(e)}), 500


@ml_bp.post("/recommend-together")
@jwt_required()
def recommend_together():
    """
    Recommend medicines frequently bought together (Apriori association rules).
    Body: { medicine_name: str }
    """
    data = request.get_json(silent=True) or {}
    medicine_name = (data.get("medicine_name") or "").strip()

    if not medicine_name:
        return jsonify({"success": False, "message": "medicine_name is required."}), 400

    try:
        recommender = _load_recommender()
        result = recommender.get_recommendations(medicine_name)
        return jsonify({"success": True, **result}), 200
    except Exception as e:
        logger.error(f"Recommendation error: {e}", exc_info=True)
        return jsonify({"success": False, "message": str(e)}), 500


@ml_bp.post("/process-prescription")
@jwt_required()
def process_prescription():
    """
    Submit a prescription for OCR processing.
    Body: { prescription_id: int }
    """
    data = request.get_json(silent=True) or {}
    prescription_id = data.get("prescription_id")

    if not prescription_id:
        return jsonify({"success": False, "message": "prescription_id is required."}), 400

    from models.prescription import Prescription
    from database.db import db
    import json

    prescription = Prescription.query.get(int(prescription_id))
    if not prescription:
        return jsonify({"success": False, "message": "Prescription not found."}), 404

    prescription.status = "processing"
    db.session.commit()

    # Swap with real OCR service when ready
    mock_result = {
        "prescription_id": prescription.id,
        "status": "processed",
        "extracted_medicines": [
            {"name": "Paracetamol", "dosage": "500mg", "frequency": "twice daily", "duration": "5 days"},
        ],
        "doctor_name": prescription.doctor_name or "Unknown",
        "patient_name": prescription.patient_name or "Unknown",
        "note": "OCR service placeholder — connect real service via ml_proxy_service.py",
    }

    prescription.ocr_result = json.dumps(mock_result)
    prescription.status = "completed"
    db.session.commit()

    return jsonify({"success": True, "result": mock_result}), 200


@ml_bp.get("/known-medicines")
@jwt_required()
def known_medicines():
    """Return all medicine names known to the recommendation engine."""
    try:
        recommender = _load_recommender()
        medicines = recommender.get_all_known_medicines()
        return jsonify({"success": True, "count": len(medicines), "medicines": medicines}), 200
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


@ml_bp.get("/status")
@jwt_required()
def ml_status():
    """Health check — loads and checks all 3 ML models."""
    status = {}

    try:
        p = _load_predictor()
        s = p.summary()
        status["demand_predictor"] = {"status": "ok", "model": s["model"], "samples": s["training_samples"]}
    except Exception as e:
        status["demand_predictor"] = {"status": "error", "error": str(e)}

    try:
        f = _load_finder()
        status["alternate_medicine"] = {"status": "ok", "dataset_rows": len(f.df) if f.df is not None else 0}
    except Exception as e:
        status["alternate_medicine"] = {"status": "error", "error": str(e)}

    try:
        r = _load_recommender()
        status["recommender"] = {"status": "ok", "rules": len(r.rules) if r.rules is not None else 0}
    except Exception as e:
        status["recommender"] = {"status": "error", "error": str(e)}

    overall = "ok" if all(v["status"] == "ok" for v in status.values()) else "degraded"
    return jsonify({"success": True, "overall": overall, "models": status}), 200
