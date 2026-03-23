"""Intruder log model – captures unknown faces."""
from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func

from app.database import Base


class IntruderLog(Base):
    __tablename__ = "intruder_logs"

    id = Column(Integer, primary_key=True, index=True)
    image_path = Column(String(255), nullable=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    location = Column(String(100), nullable=True)
    notes = Column(String(255), nullable=True)
