"""
Database seeder – creates default admin, teacher, and sample students on startup.
"""
import logging
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.user import User, UserRole
from app.models.student import Student
from app.services.auth_service import hash_password

logger = logging.getLogger("attendx.seed")

DEFAULT_USERS = [
    {
        "name": "Admin User",
        "email": "admin@attendx.com",
        "password": "admin123",
        "role": UserRole.admin,
    },
    {
        "name": "Dr. Sarah Johnson",
        "email": "teacher@attendx.com",
        "password": "teacher123",
        "role": UserRole.teacher,
    },
    {
        "name": "Alice Smith",
        "email": "alice@attendx.com",
        "password": "student123",
        "role": UserRole.student,
        "roll_number": "CS2024001",
        "class_name": "Computer Science - A",
    },
    {
        "name": "Bob Martinez",
        "email": "bob@attendx.com",
        "password": "student123",
        "role": UserRole.student,
        "roll_number": "CS2024002",
        "class_name": "Computer Science - A",
    },
    {
        "name": "Carol Chen",
        "email": "carol@attendx.com",
        "password": "student123",
        "role": UserRole.student,
        "roll_number": "CS2024003",
        "class_name": "Computer Science - A",
    },
    {
        "name": "David Kumar",
        "email": "david@attendx.com",
        "password": "student123",
        "role": UserRole.student,
        "roll_number": "CS2024004",
        "class_name": "Computer Science - B",
    },
    {
        "name": "Eva Rodriguez",
        "email": "eva@attendx.com",
        "password": "student123",
        "role": UserRole.student,
        "roll_number": "CS2024005",
        "class_name": "Computer Science - B",
    },
]


def seed_database():
    """Seed default users and students if the DB is empty."""
    db: Session = SessionLocal()
    try:
        if db.query(User).count() > 0:
            logger.info("Database already seeded – skipping.")
            return

        logger.info("Seeding database with default users...")
        for udata in DEFAULT_USERS:
            user = User(
                name=udata["name"],
                email=udata["email"],
                hashed_password=hash_password(udata["password"]),
                role=udata["role"],
            )
            db.add(user)
            db.flush()

            if udata["role"] == UserRole.student:
                student = Student(
                    user_id=user.id,
                    roll_number=udata["roll_number"],
                    class_name=udata["class_name"],
                )
                db.add(student)

        db.commit()
        logger.info("✅ Database seeded successfully.")
    except Exception as e:
        db.rollback()
        logger.error(f"Seed error: {e}")
    finally:
        db.close()
