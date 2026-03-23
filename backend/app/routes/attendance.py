"""
Attendance routes – mark, list, export CSV.
POST /attendance/mark-face   → face recognition triggered
POST /attendance/mark-manual → manual mark by teacher
GET  /attendance             → list with filters
GET  /attendance/export-csv  → download CSV
GET  /attendance/student/{id} → student-specific
"""
import csv
import io
import logging
from datetime import date, datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.attendance import AttendanceLog
from app.models.student import Student
from app.models.user import User
from app.services.face_recognition_service import recognize_face_from_base64
from app.utils.dependencies import get_current_user, require_teacher_or_admin

logger = logging.getLogger("attendx.attendance")
router = APIRouter()


class ManualMarkRequest(BaseModel):
    student_id: int
    status: str = "present"  # present / absent / late
    date: Optional[str] = None  # YYYY-MM-DD, defaults to today
    notes: Optional[str] = None


class FaceMarkRequest(BaseModel):
    image: str  # base64 encoded
    class_name: Optional[str] = None


class AttendanceOut(BaseModel):
    id: int
    student_id: int
    date: str
    time: str
    status: str
    marked_by: Optional[str]
    notes: Optional[str]
    student_name: Optional[str]
    roll_number: Optional[str]
    class_name: Optional[str]


def _log_to_out(log: AttendanceLog) -> dict:
    return {
        "id": log.id,
        "student_id": log.student_id,
        "date": str(log.date),
        "time": str(log.time),
        "status": log.status,
        "marked_by": log.marked_by,
        "notes": log.notes,
        "student_name": log.student.user.name if log.student and log.student.user else None,
        "roll_number": log.student.roll_number if log.student else None,
        "class_name": log.student.class_name if log.student else None,
    }


@router.post("/mark-face")
async def mark_attendance_face(
    payload: FaceMarkRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher_or_admin),
):
    """Mark attendance using face recognition from a webcam image."""
    result = recognize_face_from_base64(payload.image, db)
    return result


@router.post("/mark-manual")
def mark_manual(
    payload: ManualMarkRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher_or_admin),
):
    """Manually mark attendance for a specific student."""
    student = db.query(Student).filter(Student.id == payload.student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    att_date = date.fromisoformat(payload.date) if payload.date else date.today()
    att_time = datetime.now().time()

    # Prevent duplicate for same student+date
    existing = db.query(AttendanceLog).filter(
        AttendanceLog.student_id == payload.student_id,
        AttendanceLog.date == att_date,
    ).first()
    if existing:
        existing.status = payload.status
        existing.notes = payload.notes
        db.commit()
        return {"message": "Attendance updated", "action": "updated"}

    log = AttendanceLog(
        student_id=payload.student_id,
        date=att_date,
        time=att_time,
        status=payload.status,
        marked_by=current_user.name,
        notes=payload.notes,
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return {"message": "Attendance marked", "action": "created", "log": _log_to_out(log)}


@router.get("/")
def list_attendance(
    class_name: Optional[str] = None,
    student_id: Optional[int] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List attendance logs with optional filters."""
    query = db.query(AttendanceLog)

    if student_id:
        query = query.filter(AttendanceLog.student_id == student_id)
    if class_name:
        query = query.join(Student).filter(Student.class_name == class_name)
    if start_date:
        query = query.filter(AttendanceLog.date >= date.fromisoformat(start_date))
    if end_date:
        query = query.filter(AttendanceLog.date <= date.fromisoformat(end_date))

    # Students can only see their own records
    if current_user.role == "student" and current_user.student_profile:
        query = query.filter(AttendanceLog.student_id == current_user.student_profile.id)

    logs = query.order_by(AttendanceLog.date.desc(), AttendanceLog.time.desc()).limit(500).all()
    return [_log_to_out(log) for log in logs]


@router.get("/student/{student_id}")
def get_student_attendance(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all attendance records for a specific student."""
    logs = (
        db.query(AttendanceLog)
        .filter(AttendanceLog.student_id == student_id)
        .order_by(AttendanceLog.date.desc())
        .all()
    )
    return [_log_to_out(log) for log in logs]


@router.get("/export-csv")
def export_csv(
    class_name: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher_or_admin),
):
    """Download attendance records as a CSV file."""
    query = db.query(AttendanceLog)
    if class_name:
        query = query.join(Student).filter(Student.class_name == class_name)
    if start_date:
        query = query.filter(AttendanceLog.date >= date.fromisoformat(start_date))
    if end_date:
        query = query.filter(AttendanceLog.date <= date.fromisoformat(end_date))

    logs = query.order_by(AttendanceLog.date.desc()).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["ID", "Student Name", "Roll Number", "Class", "Date", "Time", "Status", "Marked By", "Notes"])

    for log in logs:
        writer.writerow([
            log.id,
            log.student.user.name if log.student and log.student.user else "",
            log.student.roll_number if log.student else "",
            log.student.class_name if log.student else "",
            str(log.date),
            str(log.time),
            log.status,
            log.marked_by or "",
            log.notes or "",
        ])

    output.seek(0)
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode("utf-8")),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=attendance_report.csv"},
    )
