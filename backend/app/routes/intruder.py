"""
Intruder routes – list and view unknown face captures.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models.intruder import IntruderLog
from app.models.user import User
from app.utils.dependencies import require_teacher_or_admin

router = APIRouter()


@router.get("/logs")
def get_intruder_logs(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher_or_admin),
):
    """Return all intruder detection events."""
    logs = db.query(IntruderLog).order_by(IntruderLog.timestamp.desc()).limit(100).all()
    return [
        {
            "id": log.id,
            "image_url": f"/intruder_images/{log.image_path.split('/')[-1]}" if log.image_path else None,
            "timestamp": str(log.timestamp),
            "location": log.location,
            "notes": log.notes,
        }
        for log in logs
    ]


@router.delete("/logs/{log_id}")
def delete_intruder_log(
    log_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher_or_admin),
):
    log = db.query(IntruderLog).filter(IntruderLog.id == log_id).first()
    if not log:
        return {"error": "Log not found"}
    db.delete(log)
    db.commit()
    return {"message": "Log deleted"}
