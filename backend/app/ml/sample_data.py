"""
Sample data generator – seeds the database with 60 days of synthetic attendance records.
Run: python -m app.ml.sample_data
"""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../../.."))

from datetime import date, timedelta, time
import random
from app.database import SessionLocal, engine, Base
from app.models.student import Student
from app.models.attendance import AttendanceLog

Base.metadata.create_all(bind=engine)


def generate_sample_data(days: int = 60):
    db = SessionLocal()
    try:
        students = db.query(Student).all()
        if not students:
            print("❌ No students found. Run the app first to seed default users.")
            return

        today = date.today()
        start = today - timedelta(days=days)
        statuses = ["present", "present", "present", "present", "absent"]  # 80% present

        inserted = 0
        for student in students:
            attendance_rate = random.uniform(0.65, 0.95)  # each student varies

            for day_offset in range(days):
                current_date = start + timedelta(days=day_offset)

                # Skip weekends
                if current_date.weekday() >= 5:
                    continue

                # Don't mark future dates
                if current_date > today:
                    break

                # Check if already exists
                existing = db.query(AttendanceLog).filter(
                    AttendanceLog.student_id == student.id,
                    AttendanceLog.date == current_date,
                ).first()
                if existing:
                    continue

                status = "present" if random.random() < attendance_rate else "absent"
                log_time = time(
                    hour=random.randint(8, 10),
                    minute=random.randint(0, 59),
                )
                log = AttendanceLog(
                    student_id=student.id,
                    date=current_date,
                    time=log_time,
                    status=status,
                    marked_by="sample_data_generator",
                )
                db.add(log)
                inserted += 1

        db.commit()
        print(f"✅ Generated {inserted} attendance records for {len(students)} students.")
    except Exception as e:
        db.rollback()
        print(f"❌ Error: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    generate_sample_data()
