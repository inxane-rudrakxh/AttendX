"""
Train attendance prediction model using scikit-learn.
Run: python -m app.ml.train_model (from backend directory)
"""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../../.."))

from datetime import date
import numpy as np
import joblib
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report

from app.database import SessionLocal, engine, Base
from app.models.student import Student
from app.models.attendance import AttendanceLog

Base.metadata.create_all(bind=engine)

MODEL_PATH = os.path.join(os.path.dirname(__file__), "attendance_model.pkl")


def extract_features_labels(db):
    students = db.query(Student).all()
    X, y = [], []

    for student in students:
        logs = student.attendance_records
        if len(logs) < 5:
            continue

        total = len(logs)
        present = sum(1 for l in logs if l.status == "present")
        overall_pct = present / total * 100 if total > 0 else 0

        today = date.today()
        last7 = [l for l in logs if (today - l.date).days <= 7]
        last30 = [l for l in logs if (today - l.date).days <= 30]

        pct7 = sum(1 for l in last7 if l.status == "present") / len(last7) * 100 if last7 else 0
        pct30 = sum(1 for l in last30 if l.status == "present") / len(last30) * 100 if last30 else 0

        sorted_logs = sorted(logs, key=lambda l: l.date, reverse=True)
        consec_absent = 0
        for l in sorted_logs:
            if l.status == "absent":
                consec_absent += 1
            else:
                break

        features = [total, present, overall_pct, pct7, pct30, consec_absent]
        label = 1 if overall_pct < 75 else 0  # 1 = at risk

        X.append(features)
        y.append(label)

    return np.array(X), np.array(y)


def train():
    db = SessionLocal()
    try:
        X, y = extract_features_labels(db)
        if len(X) < 3:
            print("❌ Not enough data to train. Run sample_data.py first.")
            return

        print(f"Training on {len(X)} student records...")
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

        model = RandomForestClassifier(n_estimators=100, random_state=42)
        model.fit(X_train, y_train)

        if len(X_test) > 0:
            print(classification_report(y_test, model.predict(X_test), zero_division=0))

        joblib.dump(model, MODEL_PATH)
        print(f"✅ Model saved to {MODEL_PATH}")
    finally:
        db.close()


if __name__ == "__main__":
    train()
