"""Student profile model."""
from sqlalchemy import Column, Integer, String, ForeignKey, Text
from sqlalchemy.orm import relationship

from app.database import Base


class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    roll_number = Column(String(50), unique=True, nullable=False)
    class_name = Column(String(100), nullable=False)
    face_encoding_path = Column(String(255), nullable=True)  # path to stored face image

    # Relationships
    user = relationship("User", back_populates="student_profile")
    attendance_records = relationship("AttendanceLog", back_populates="student")
