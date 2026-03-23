"""
Face Recognition Service using DeepFace + OpenCV.
Uses DeepFace for robust face recognition without needing dlib/CMake.
"""
import os
import base64
import logging
import tempfile
from datetime import date, datetime

import cv2
import numpy as np

logger = logging.getLogger("attendx.face_recognition")

KNOWN_FACES_DIR = os.getenv("KNOWN_FACES_DIR", "app/known_faces")
INTRUDER_IMAGES_DIR = os.getenv("INTRUDER_IMAGES_DIR", "app/intruder_images")


def _base64_to_image(b64_string: str) -> np.ndarray:
    """Decode a base64 string to an OpenCV image array."""
    if "," in b64_string:
        b64_string = b64_string.split(",")[1]
    img_bytes = base64.b64decode(b64_string)
    np_arr = np.frombuffer(img_bytes, np.uint8)
    return cv2.imdecode(np_arr, cv2.IMREAD_COLOR)


def _save_intruder_image(image: np.ndarray, db) -> str:
    """Save an unknown face image and log it in the database."""
    from app.models.intruder import IntruderLog

    os.makedirs(INTRUDER_IMAGES_DIR, exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"intruder_{timestamp}.jpg"
    filepath = os.path.join(INTRUDER_IMAGES_DIR, filename)
    cv2.imwrite(filepath, image)

    intruder_log = IntruderLog(image_path=filepath)
    db.add(intruder_log)
    db.commit()
    logger.warning(f"🚨 Intruder detected! Image saved: {filepath}")
    return filepath


def recognize_face_from_base64(b64_image: str, db) -> dict:
    """
    Main face recognition pipeline.
    1. Decode base64 image
    2. Compare against known face images using DeepFace
    3. If match → mark attendance
    4. If no match → save as intruder
    """
    from app.models.student import Student
    from app.models.attendance import AttendanceLog

    try:
        # Try importing DeepFace
        from deepface import DeepFace
        use_deepface = True
    except ImportError:
        use_deepface = False
        logger.warning("DeepFace not available. Using OpenCV fallback.")

    # Decode incoming frame
    frame = _base64_to_image(b64_image)
    if frame is None:
        return {"success": False, "message": "Failed to decode image"}

    # Collect all registered students with face images
    students_with_faces = db.query(Student).filter(
        Student.face_encoding_path.isnot(None)
    ).all()

    if not students_with_faces:
        return {
            "success": False,
            "message": "No registered faces in database. Please register student faces first.",
            "recognized": False,
        }

    # Save frame to temp file for DeepFace comparison
    with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as tmp:
        tmp_path = tmp.name
        cv2.imwrite(tmp_path, frame)

    matched_student = None
    best_distance = float("inf")

    try:
        if use_deepface:
            for student in students_with_faces:
                if not os.path.exists(student.face_encoding_path):
                    continue
                try:
                    result = DeepFace.verify(
                        img1_path=tmp_path,
                        img2_path=student.face_encoding_path,
                        model_name="VGG-Face",
                        distance_metric="cosine",
                        enforce_detection=False,
                    )
                    if result.get("verified") and result.get("distance", 1.0) < best_distance:
                        best_distance = result["distance"]
                        matched_student = student
                except Exception as e:
                    logger.debug(f"DeepFace compare error for student {student.id}: {e}")
                    continue
        else:
            # OpenCV fallback: simple histogram comparison
            for student in students_with_faces:
                if not os.path.exists(student.face_encoding_path):
                    continue
                known_img = cv2.imread(student.face_encoding_path)
                if known_img is None:
                    continue
                # Resize both to same dimensions
                h, w = 100, 100
                frame_resized = cv2.resize(frame, (w, h))
                known_resized = cv2.resize(known_img, (w, h))
                # Histogram comparison
                hist1 = cv2.calcHist([cv2.cvtColor(frame_resized, cv2.COLOR_BGR2GRAY)], [0], None, [256], [0, 256])
                hist2 = cv2.calcHist([cv2.cvtColor(known_resized, cv2.COLOR_BGR2GRAY)], [0], None, [256], [0, 256])
                score = cv2.compareHist(hist1, hist2, cv2.HISTCMP_CORREL)
                if score > 0.85 and (1.0 - score) < best_distance:
                    best_distance = 1.0 - score
                    matched_student = student

    finally:
        try:
            os.unlink(tmp_path)
        except Exception:
            pass

    if matched_student:
        # Mark attendance
        today = date.today()
        now = datetime.now().time()

        existing = db.query(AttendanceLog).filter(
            AttendanceLog.student_id == matched_student.id,
            AttendanceLog.date == today,
        ).first()

        if existing:
            return {
                "success": True,
                "message": f"Attendance already marked for {matched_student.user.name} today.",
                "recognized": True,
                "student_name": matched_student.user.name,
                "roll_number": matched_student.roll_number,
                "already_marked": True,
            }

        log = AttendanceLog(
            student_id=matched_student.id,
            date=today,
            time=now,
            status="present",
            marked_by="face_recognition",
        )
        db.add(log)
        db.commit()

        logger.info(f"✅ Attendance marked for {matched_student.user.name}")
        return {
            "success": True,
            "message": f"Attendance marked for {matched_student.user.name}",
            "recognized": True,
            "student_name": matched_student.user.name,
            "roll_number": matched_student.roll_number,
            "class_name": matched_student.class_name,
            "already_marked": False,
        }
    else:
        # Unknown face – save as intruder
        intruder_path = _save_intruder_image(frame, db)
        return {
            "success": False,
            "message": "Face not recognized. Logged as intruder.",
            "recognized": False,
            "intruder_image": intruder_path,
        }
