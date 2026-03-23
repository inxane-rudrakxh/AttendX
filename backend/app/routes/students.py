"""
Students routes – CRUD operations and face encoding registration.
"""
import os
import base64
import logging
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.models.student import Student
from app.models.user import User, UserRole
from app.services.auth_service import hash_password
from app.utils.dependencies import get_current_user, require_teacher_or_admin, require_admin

logger = logging.getLogger("attendx.students")
router = APIRouter()

KNOWN_FACES_DIR = os.getenv("KNOWN_FACES_DIR", "app/known_faces")


class StudentOut(BaseModel):
    id: int
    roll_number: str
    class_name: str
    face_encoding_path: Optional[str]
    user_id: int
    name: str
    email: str

    class Config:
        from_attributes = True


class CreateStudentRequest(BaseModel):
    name: str
    email: str
    password: str
    roll_number: str
    class_name: str


def _student_to_out(s: Student) -> dict:
    return {
        "id": s.id,
        "roll_number": s.roll_number,
        "class_name": s.class_name,
        "face_encoding_path": s.face_encoding_path,
        "user_id": s.user_id,
        "name": s.user.name if s.user else "",
        "email": s.user.email if s.user else "",
    }


@router.get("/", response_model=List[dict])
def list_students(
    class_name: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher_or_admin),
):
    query = db.query(Student)
    if class_name:
        query = query.filter(Student.class_name == class_name)
    students = query.all()
    return [_student_to_out(s) for s in students]


@router.get("/{student_id}", response_model=dict)
def get_student(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return _student_to_out(student)


@router.post("/", status_code=201)
def create_student(
    payload: CreateStudentRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    if db.query(Student).filter(Student.roll_number == payload.roll_number).first():
        raise HTTPException(status_code=400, detail="Roll number already exists")

    user = User(
        name=payload.name,
        email=payload.email,
        hashed_password=hash_password(payload.password),
        role=UserRole.student,
    )
    db.add(user)
    db.flush()

    student = Student(user_id=user.id, roll_number=payload.roll_number, class_name=payload.class_name)
    db.add(student)
    db.commit()
    db.refresh(student)
    return _student_to_out(student)


@router.delete("/{student_id}")
def delete_student(
    student_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    db.delete(student)
    db.commit()
    return {"message": "Student deleted"}


@router.post("/{student_id}/register-face")
async def register_face(
    student_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher_or_admin),
):
    """Upload a face photo for a student to enable face-recognition attendance."""
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    os.makedirs(KNOWN_FACES_DIR, exist_ok=True)
    filename = f"student_{student_id}_{student.roll_number}.jpg"
    filepath = os.path.join(KNOWN_FACES_DIR, filename)

    contents = await file.read()
    with open(filepath, "wb") as f:
        f.write(contents)

    student.face_encoding_path = filepath
    db.commit()

    logger.info(f"Face registered for student {student_id} at {filepath}")
    return {"message": "Face registered successfully", "path": filepath}


@router.post("/{student_id}/register-face-base64")
async def register_face_base64(
    student_id: int,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher_or_admin),
):
    """Register face from base64 encoded image (from webcam capture)."""
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    image_data = payload.get("image")
    if not image_data:
        raise HTTPException(status_code=400, detail="No image data provided")

    # Strip data URL prefix if present
    if "," in image_data:
        image_data = image_data.split(",")[1]

    os.makedirs(KNOWN_FACES_DIR, exist_ok=True)
    filename = f"student_{student_id}_{student.roll_number}.jpg"
    filepath = os.path.join(KNOWN_FACES_DIR, filename)

    with open(filepath, "wb") as f:
        f.write(base64.b64decode(image_data))

    student.face_encoding_path = filepath
    db.commit()

    return {"message": "Face registered successfully", "student_id": student_id}
