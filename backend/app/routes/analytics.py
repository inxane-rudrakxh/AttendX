"""
Analytics routes – summary, trend, prediction, and risk data.
"""
import logging
from datetime import date, timedelta
from collections import defaultdict
from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.attendance import AttendanceLog
from app.models.student import Student
from app.models.user import User
from app.utils.dependencies import get_current_user

logger = logging.getLogger("attendx.analytics")
router = APIRouter()


def _calc_percentage(present: int, total: int) -> float:
    return round((present / total) * 100, 1) if total > 0 else 0.0


@router.get("/summary")
def get_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Overall summary stats for admin/teacher dashboard."""
    total_students = db.query(Student).count()
    today = date.today()

    # Attendance today
    today_logs = db.query(AttendanceLog).filter(AttendanceLog.date == today).all()
    present_today = sum(1 for l in today_logs if l.status == "present")

    # All-time attendance percentage per student
    all_students = db.query(Student).all()
    risk_students = []
    class_stats = defaultdict(lambda: {"total": 0, "present": 0})

    for student in all_students:
        logs = student.attendance_records
        total = len(logs)
        present = sum(1 for l in logs if l.status == "present")
        pct = _calc_percentage(present, total)

        class_stats[student.class_name]["total"] += 1
        class_stats[student.class_name]["present"] += (1 if pct >= 75 else 0)

        if total > 0 and pct < 75:
            risk_students.append({
                "student_id": student.id,
                "name": student.user.name if student.user else "Unknown",
                "roll_number": student.roll_number,
                "class_name": student.class_name,
                "attendance_percentage": pct,
                "total_classes": total,
                "present_count": present,
            })

    # Overall attendance pct across all records
    all_logs = db.query(AttendanceLog).all()
    total_logs = len(all_logs)
    total_present = sum(1 for l in all_logs if l.status == "present")
    overall_pct = _calc_percentage(total_present, total_logs)

    return {
        "total_students": total_students,
        "present_today": present_today,
        "absent_today": len(today_logs) - present_today,
        "total_attendance_today": len(today_logs),
        "overall_attendance_percentage": overall_pct,
        "risk_students_count": len(risk_students),
        "risk_students": risk_students,
        "class_stats": {k: v for k, v in class_stats.items()},
    }


@router.get("/trends")
def get_trends(
    days: int = 30,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Daily attendance trend for the last N days."""
    today = date.today()
    start = today - timedelta(days=days)

    logs = db.query(AttendanceLog).filter(AttendanceLog.date >= start).all()

    # Build daily buckets
    day_data = defaultdict(lambda: {"present": 0, "absent": 0, "late": 0, "total": 0})
    for log in logs:
        ds = str(log.date)
        day_data[ds][log.status] = day_data[ds].get(log.status, 0) + 1
        day_data[ds]["total"] += 1

    result = []
    for i in range(days):
        d = start + timedelta(days=i)
        ds = str(d)
        entry = day_data.get(ds, {"present": 0, "absent": 0, "late": 0, "total": 0})
        result.append({
            "date": ds,
            "present": entry["present"],
            "absent": entry["absent"],
            "late": entry.get("late", 0),
            "total": entry["total"],
            "percentage": _calc_percentage(entry["present"], entry["total"]),
        })

    return result


@router.get("/student/{student_id}")
def get_student_analytics(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Per-student attendance analytics."""
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        return {"error": "Student not found"}

    logs = student.attendance_records
    total = len(logs)
    present = sum(1 for l in logs if l.status == "present")
    absent = sum(1 for l in logs if l.status == "absent")
    late = sum(1 for l in logs if l.status == "late")

    monthly = defaultdict(lambda: {"present": 0, "absent": 0, "late": 0})
    for log in logs:
        month_key = log.date.strftime("%Y-%m")
        monthly[month_key][log.status] = monthly[month_key].get(log.status, 0) + 1

    return {
        "student_id": student_id,
        "name": student.user.name if student.user else "Unknown",
        "roll_number": student.roll_number,
        "class_name": student.class_name,
        "total_classes": total,
        "present_count": present,
        "absent_count": absent,
        "late_count": late,
        "attendance_percentage": _calc_percentage(present, total),
        "at_risk": _calc_percentage(present, total) < 75,
        "monthly_breakdown": dict(monthly),
    }


@router.get("/class-wise")
def get_class_wise(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Attendance breakdown per class."""
    students = db.query(Student).all()
    class_data = defaultdict(lambda: {"students": 0, "total_logs": 0, "present": 0})

    for student in students:
        cn = student.class_name
        class_data[cn]["students"] += 1
        logs = student.attendance_records
        class_data[cn]["total_logs"] += len(logs)
        class_data[cn]["present"] += sum(1 for l in logs if l.status == "present")

    result = []
    for cn, data in class_data.items():
        result.append({
            "class_name": cn,
            "total_students": data["students"],
            "attendance_percentage": _calc_percentage(data["present"], data["total_logs"]),
        })

    return result


@router.get("/predict/{student_id}")
def predict_attendance(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Predict if a student is at risk of low attendance."""
    from app.ml.predict import predict_risk
    return predict_risk(student_id, db)
