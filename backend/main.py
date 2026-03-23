"""
AttendX – Main FastAPI Application Entry Point
"""
import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv

from app.database import engine, Base
from app.routes import auth, users, students, attendance, analytics, intruder
from app.utils.seed import seed_database

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("attendx")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: create tables and seed initial data."""
    logger.info("🚀 AttendX starting up...")
    Base.metadata.create_all(bind=engine)
    seed_database()
    # Ensure storage directories exist
    os.makedirs(os.getenv("KNOWN_FACES_DIR", "app/known_faces"), exist_ok=True)
    os.makedirs(os.getenv("INTRUDER_IMAGES_DIR", "app/intruder_images"), exist_ok=True)
    logger.info("✅ Database ready. AttendX is live.")
    yield
    logger.info("🛑 AttendX shutting down.")


app = FastAPI(
    title="AttendX API",
    description="AI-Powered Smart Attendance System",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS – allow frontend dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files for intruder images
if os.path.exists("app/intruder_images"):
    app.mount("/intruder_images", StaticFiles(directory="app/intruder_images"), name="intruder_images")

# Routers
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/users", tags=["Users"])
app.include_router(students.router, prefix="/students", tags=["Students"])
app.include_router(attendance.router, prefix="/attendance", tags=["Attendance"])
app.include_router(analytics.router, prefix="/analytics", tags=["Analytics"])
app.include_router(intruder.router, prefix="/intruder", tags=["Intruder"])


@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "ok", "app": "AttendX", "version": "1.0.0"}
