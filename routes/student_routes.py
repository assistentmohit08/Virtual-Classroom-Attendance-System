from flask import Blueprint, request, session
from models import (db, Student, FaceEmbedding, StudentProfile,
                    AttendanceRecord, AttendanceSession, Class)
from services.face_service import (
    extract_embedding,
    validate_single_face,
    average_embeddings
)
from utils.image_utils import validate_image
from utils.response_utils import success, error
from datetime import datetime
import os
import uuid

student_bp = Blueprint("student", __name__)


# ─────────────────────────────────────────
# HELPER
# ─────────────────────────────────────────
def student_required():
    if "user_id" not in session:
        return error("Login required", 401)
    if session.get("role") != "student":
        return error("Student access only", 403)
    return None


# ─────────────────────────────────────────
# GET /api/student/my-info
# ─────────────────────────────────────────
@student_bp.route("/my-info", methods=["GET"])
def my_info():
    auth_error = student_required()
    if auth_error:
        return auth_error

    student = Student.query.filter_by(
        user_id=session["user_id"]
    ).first()
    if not student:
        return error("Student profile not found", 404)

    embedding = FaceEmbedding.query.filter_by(
        student_id=student.id
    ).first()

    profile = StudentProfile.query.filter_by(
        student_id=student.id
    ).first()

    return success(data={
        "student":       student.to_dict(),
        "face_enrolled": embedding is not None,
        "enrolled_at":   str(embedding.created_at) if embedding else None,
        "profile":       profile.to_dict() if profile else None
    })


# ─────────────────────────────────────────
# PUT /api/student/update-profile  ← NEW
# ─────────────────────────────────────────
@student_bp.route("/update-profile", methods=["PUT"])
def update_profile():
    auth_error = student_required()
    if auth_error:
        return auth_error

    student = Student.query.filter_by(
        user_id=session["user_id"]
    ).first()
    if not student:
        return error("Student not found", 404)

    # Get or create profile
    profile = StudentProfile.query.filter_by(
        student_id=student.id
    ).first()
    if not profile:
        profile = StudentProfile(student_id=student.id)
        db.session.add(profile)

    # Handle profile photo
    if request.files.get("profile_photo"):
        photo = request.files.get("profile_photo")
        valid, err_msg = validate_image(photo)
        if not valid:
            return error(f"Photo error: {err_msg}")
        upload_dir = os.path.join("static", "uploads", "profiles")
        os.makedirs(upload_dir, exist_ok=True)
        filename   = f"{uuid.uuid4().hex}_profile.jpg"
        path       = os.path.join(upload_dir, filename)
        photo.save(path)
        profile.profile_photo = path

    # Handle text fields
    data = request.form if request.form else request.get_json() or {}

    if data.get("phone"):
        phone = str(data["phone"]).strip()
        if len(phone) > 15:
            return error("Phone number too long")
        profile.phone = phone

    if data.get("address"):
        profile.address = str(data["address"]).strip()

    if data.get("dob"):
        try:
            profile.dob = datetime.strptime(
                data["dob"], "%Y-%m-%d"
            ).date()
        except ValueError:
            return error("Invalid date. Use YYYY-MM-DD")

    profile.updated_at = datetime.utcnow()
    db.session.commit()

    return success(
        data    = profile.to_dict(),
        message = "Profile updated successfully"
    )


# ─────────────────────────────────────────
# GET /api/student/my-attendance  ← NEW
# ─────────────────────────────────────────
@student_bp.route("/my-attendance", methods=["GET"])
def my_attendance():
    auth_error = student_required()
    if auth_error:
        return auth_error

    student = Student.query.filter_by(
        user_id=session["user_id"]
    ).first()
    if not student:
        return error("Student not found", 404)

    records = AttendanceRecord.query\
        .filter_by(student_id=student.id)\
        .join(AttendanceSession)\
        .order_by(AttendanceSession.date.desc())\
        .all()

    if not records:
        return success(data={
            "summary": {
                "total_classes": 0,
                "present":       0,
                "absent":        0,
                "percentage":    0
            },
            "records": []
        }, message="No attendance records found")

    attendance = []
    for record in records:
        sess   = record.session
        class_ = Class.query.get(sess.class_id)
        attendance.append({
            "session_id": sess.id,
            "date":       str(sess.date),
            "class_name": class_.class_name if class_ else "Unknown",
            "status":     record.status
        })

    total   = len(attendance)
    present = sum(1 for a in attendance if a["status"] == "present")
    absent  = total - present

    return success(data={
        "summary": {
            "total_classes": total,
            "present":       present,
            "absent":        absent,
            "percentage":    round((present / total) * 100, 1) if total > 0 else 0
        },
        "records": attendance
    })


# ─────────────────────────────────────────
# POST /api/student/enroll-face
# ─────────────────────────────────────────
@student_bp.route("/enroll-face", methods=["POST"])
def enroll_face():
    auth_error = student_required()
    if auth_error:
        return auth_error

    user_id = session["user_id"]

    student = Student.query.filter_by(user_id=user_id).first()
    if not student:
        return error("Student not found. Ask teacher to enroll you first", 404)

    existing = FaceEmbedding.query.filter_by(
        student_id=student.id
    ).first()
    if existing:
        return error("Face already enrolled. Contact teacher to re-enroll", 409)

    photos = []
    for i in range(1, 4):
        photo = request.files.get(f"photo{i}")
        if not photo:
            return error(f"photo{i} is required. Upload exactly 3 photos")
        photos.append(photo)

    saved_paths = []
    upload_dir  = os.path.join("static", "uploads", "students")
    os.makedirs(upload_dir, exist_ok=True)

    for i, photo in enumerate(photos):
        valid, err_msg = validate_image(photo)
        if not valid:
            return error(f"Photo {i+1}: {err_msg}")
        filename = f"{uuid.uuid4().hex}_photo{i+1}.jpg"
        path     = os.path.join(upload_dir, filename)
        photo.save(path)
        saved_paths.append(path)

    embeddings = []
    for i, path in enumerate(saved_paths):
        valid, err_msg = validate_single_face(path)
        if not valid:
            for p in saved_paths:
                if os.path.exists(p): os.remove(p)
            return error(f"Photo {i+1}: {err_msg}")

        emb = extract_embedding(path)
        if emb is None:
            for p in saved_paths:
                if os.path.exists(p): os.remove(p)
            return error(f"Photo {i+1}: Could not extract embedding")
        embeddings.append(emb)

    avg_embedding = average_embeddings(embeddings)
    face_record   = FaceEmbedding(student_id=student.id)
    face_record.set_embedding(avg_embedding)
    db.session.add(face_record)
    db.session.commit()

    return success(
        data={
            "student_id":   student.id,
            "roll_number":  student.roll_number,
            "embedding_id": face_record.id,
            "photos_used":  3
        },
        message = "Face enrolled successfully!",
        status  = 201
    )