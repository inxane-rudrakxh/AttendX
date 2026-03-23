"""
ML Prediction Module – Attendance risk prediction using scikit-learn.
Predicts if a student is likely to fall below 75% attendance threshold.
"""
import os
import logging
from datetime import date, timedelta

import numpy as np

logger = logging.getLogger("attendx.predict")

MODEL_PATH = os.path.join(os.path.dirname(__file__), "attendance_model.pkl")


def _extract_features(student, db) -> list:
    """
    Extract feature vector from a student's attendance history.
    Features:
    - Total classes held
    - Total present count
    - Current attendance %
    - Last 7-day attendance %
    - Last 30-day attendance %
    - Consecutive absences (recent)
    """
    logs = student.attendance_records
    total = len(logs)
    present = sum(1 for l in logs if l.status == "present")
    overall_pct = (present / total * 100) if total > 0 else 0.0

    today = date.today()
    last7 = [l for l in logs if (today - l.date).days <= 7]
    last30 = [l for l in logs if (today - l.date).days <= 30]

    pct7 = sum(1 for l in last7 if l.status == "present") / len(last7) * 100 if last7 else 0.0
    pct30 = sum(1 for l in last30 if l.status == "present") / len(last30) * 100 if last30 else 0.0

    # Count consecutive absences at end
    sorted_logs = sorted(logs, key=lambda l: l.date, reverse=True)
    consec_absent = 0
    for l in sorted_logs:
        if l.status == "absent":
            consec_absent += 1
        else:
            break

    return [total, present, overall_pct, pct7, pct30, consec_absent]


def predict_risk(student_id: int, db) -> dict:
    """Return risk prediction for a student."""
    from app.models.student import Student

    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        return {"error": "Student not found"}

    features = _extract_features(student, db)
    total, present, overall_pct, pct7, pct30, consec_absent = features

    # Rule-based risk scoring (works without trained model)
    risk_score = 0.0
    risk_factors = []

    if overall_pct < 75:
        risk_score += 0.5
        risk_factors.append(f"Overall attendance ({overall_pct:.1f}%) is below 75%")
    if pct7 < 60:
        risk_score += 0.3
        risk_factors.append(f"Last 7-day attendance ({pct7:.1f}%) is very low")
    if consec_absent >= 3:
        risk_score += 0.2
        risk_factors.append(f"{consec_absent} consecutive absences")
    if total < 10:
        risk_score += 0.1
        risk_factors.append("Insufficient attendance history")

    # Try to use trained ML model if available
    try:
        import joblib
        if os.path.exists(MODEL_PATH):
            model = joblib.load(MODEL_PATH)
            prob = model.predict_proba([features])[0][1]
            risk_score = float(prob)
    except Exception as e:
        logger.debug(f"ML model not available, using rule-based: {e}")

    risk_level = "HIGH" if risk_score > 0.6 else "MEDIUM" if risk_score > 0.35 else "LOW"

    return {
        "student_id": student_id,
        "name": student.user.name if student.user else "Unknown",
        "roll_number": student.roll_number,
        "overall_attendance_pct": round(overall_pct, 1),
        "last_7_days_pct": round(pct7, 1),
        "last_30_days_pct": round(pct30, 1),
        "consecutive_absences": consec_absent,
        "risk_score": round(min(risk_score, 1.0), 3),
        "risk_level": risk_level,
        "at_risk": risk_score > 0.35,
        "risk_factors": risk_factors,
    }
