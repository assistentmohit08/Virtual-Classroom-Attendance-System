from flask import Blueprint, request, session
from models import (db, Class, AttendanceSession,
                    AttendanceRecord, Student, StudentProfile)
from services.attendance_service import take_attendance
from utils.image_utils import validate_image
from utils.response_utils import success, error
from config import Config
import os
import uuid

teacher_bp = Blueprint("teacher", __name__)


# ─────────────────────────────────────────
# HELPER
# ─────────────────────────────────────────
def teacher_required():
    if "user_id" not in session:
        return error("Login required", 401)
    if session.get("role") != "teacher":
        return error("Teacher access only", 403)
    return None


def get_student_photo(student):
    """
    Returns profile photo path if uploaded, else None.
    """
    profile = StudentProfile.query.filter_by(
        student_id=student.id
    ).first()
    if profile and profile.profile_photo:
        return profile.profile_photo
    return None


# ─────────────────────────────────────────
# POST /api/teacher/take-attendance
# ─────────────────────────────────────────
@teacher_bp.route("/take-attendance", methods=["POST"])
def take_attendance_route():
    auth_error = teacher_required()
    if auth_error:
        return auth_error

    class_id = request.form.get("class_id")
    if not class_id:
        return error("'class_id' is required")

    class_ = Class.query.filter_by(
        id         = int(class_id),
        teacher_id = session["user_id"]
    ).first()
    if not class_:
        return error("Class not found or not yours", 404)

    image = request.files.get("image")
    if not image:
        return error("Classroom image is required")

    valid, err_msg = validate_image(image)
    if not valid:
        return error(f"Image error: {err_msg}")

    upload_dir = os.path.join("static", "uploads", "classrooms")
    os.makedirs(upload_dir, exist_ok=True)
    filename   = f"{uuid.uuid4().hex}_classroom.jpg"
    image_path = os.path.join(upload_dir, filename)
    image.save(image_path)

    print(f"\n🚀 Starting attendance for class: {class_.class_name}")
    result = take_attendance(
        image_path = image_path,
        class_id   = int(class_id),
        teacher_id = session["user_id"],
        threshold  = Config.FACE_SIMILARITY_THRESHOLD
    )

    return success(
        data    = result,
        message = f"Attendance taken for {class_.class_name}"
    )


# ─────────────────────────────────────────
# GET /api/teacher/attendance-report
# ─────────────────────────────────────────
@teacher_bp.route("/attendance-report", methods=["GET"])
def attendance_report():
    auth_error = teacher_required()
    if auth_error:
        return auth_error

    class_id = request.args.get("class_id")
    if not class_id:
        return error("'class_id' query param is required")

    class_ = Class.query.filter_by(
        id         = int(class_id),
        teacher_id = session["user_id"]
    ).first()
    if not class_:
        return error("Class not found or not yours", 404)

    sessions = AttendanceSession.query.filter_by(
        class_id=int(class_id)
    ).order_by(AttendanceSession.date.desc()).all()

    report = []
    for s in sessions:
        records = AttendanceRecord.query.filter_by(
            session_id=s.id
        ).all()
        report.append({
            "session_id":    s.id,
            "date":          str(s.date),
            "total":         len(records),
            "present_count": sum(1 for r in records if r.status == "present"),
            "absent_count":  sum(1 for r in records if r.status == "absent"),
            "records": [
                {
                    "roll_number": r.student.roll_number,
                    "name":        r.student.user.name,
                    "status":      r.status
                }
                for r in records
            ]
        })

    return success(
        data    = report,
        message = f"{len(sessions)} session(s) found for {class_.class_name}"
    )


# ─────────────────────────────────────────
# GET /api/teacher/sessions
# ─────────────────────────────────────────
@teacher_bp.route("/sessions", methods=["GET"])
def get_sessions():
    auth_error = teacher_required()
    if auth_error:
        return auth_error

    sessions = AttendanceSession.query.filter_by(
        teacher_id=session["user_id"]
    ).order_by(AttendanceSession.date.desc()).all()

    return success(
        data    = [s.to_dict() for s in sessions],
        message = f"{len(sessions)} session(s) found"
    )


# ─────────────────────────────────────────
# GET /api/teacher/session/<id>/present
# ─────────────────────────────────────────
@teacher_bp.route("/session/<int:session_id>/present", methods=["GET"])
def session_present(session_id):
    auth_error = teacher_required()
    if auth_error:
        return auth_error

    sess = AttendanceSession.query.filter_by(
        id         = session_id,
        teacher_id = session["user_id"]
    ).first()
    if not sess:
        return error("Session not found", 404)

    records = AttendanceRecord.query.filter_by(
        session_id = session_id,
        status     = "present"
    ).all()

    data = [{
        "student_id":    r.student_id,
        "roll_number":   r.student.roll_number,
        "name":          r.student.user.name,
        "status":        "present",
        "profile_photo": get_student_photo(r.student)
    } for r in records]

    return success(
        data    = data,
        message = f"{len(data)} student(s) present"
    )


# ─────────────────────────────────────────
# GET /api/teacher/session/<id>/absent
# ─────────────────────────────────────────
@teacher_bp.route("/session/<int:session_id>/absent", methods=["GET"])
def session_absent(session_id):
    auth_error = teacher_required()
    if auth_error:
        return auth_error

    sess = AttendanceSession.query.filter_by(
        id         = session_id,
        teacher_id = session["user_id"]
    ).first()
    if not sess:
        return error("Session not found", 404)

    records = AttendanceRecord.query.filter_by(
        session_id = session_id,
        status     = "absent"
    ).all()

    data = [{
        "student_id":    r.student_id,
        "roll_number":   r.student.roll_number,
        "name":          r.student.user.name,
        "status":        "absent",
        "profile_photo": get_student_photo(r.student)
    } for r in records]

    return success(
        data    = data,
        message = f"{len(data)} student(s) absent"
    )


# ─────────────────────────────────────────
# GET /api/teacher/session/<id>/details ← NEW
# All students with status + photo
# ─────────────────────────────────────────
@teacher_bp.route("/session/<int:session_id>/details", methods=["GET"])
def session_details(session_id):
    auth_error = teacher_required()
    if auth_error:
        return auth_error

    sess = AttendanceSession.query.filter_by(
        id         = session_id,
        teacher_id = session["user_id"]
    ).first()
    if not sess:
        return error("Session not found", 404)

    records = AttendanceRecord.query.filter_by(
        session_id=session_id
    ).all()

    present = []
    absent  = []

    for r in records:
        student_data = {
            "record_id":     r.id,
            "student_id":    r.student_id,
            "roll_number":   r.student.roll_number,
            "name":          r.student.user.name,
            "status":        r.status,
            "profile_photo": get_student_photo(r.student)
        }
        if r.status == "present":
            present.append(student_data)
        else:
            absent.append(student_data)

    return success(data={
        "session_id":    sess.id,
        "date":          str(sess.date),
        "class_id":      sess.class_id,
        "present_count": len(present),
        "absent_count":  len(absent),
        "total":         len(records),
        "present":       present,
        "absent":        absent
    })


# ─────────────────────────────────────────
# PATCH /api/teacher/session/<id>/update-status ← NEW
# Bulk manual attendance override
# ─────────────────────────────────────────
@teacher_bp.route("/session/<int:session_id>/update-status", methods=["PATCH"])
def update_attendance_status(session_id):
    auth_error = teacher_required()
    if auth_error:
        return auth_error

    # Verify session belongs to this teacher
    sess = AttendanceSession.query.filter_by(
        id         = session_id,
        teacher_id = session["user_id"]
    ).first()
    if not sess:
        return error("Session not found", 404)

    data = request.get_json()
    if not data or not data.get("updates"):
        return error("'updates' list is required")

    # Expected format:
    # { "updates": [ { "student_id": 1, "status": "present" }, ... ] }
    updates  = data["updates"]
    updated  = []
    errors   = []

    for item in updates:
        student_id = item.get("student_id")
        new_status = item.get("status")

        # Validate status value
        if new_status not in ["present", "absent"]:
            errors.append(f"Invalid status for student {student_id}")
            continue

        # Find the record
        record = AttendanceRecord.query.filter_by(
            session_id = session_id,
            student_id = student_id
        ).first()

        if not record:
            errors.append(f"No record found for student {student_id}")
            continue

        # Update status
        old_status     = record.status
        record.status  = new_status
        updated.append({
            "student_id":  student_id,
            "old_status":  old_status,
            "new_status":  new_status
        })

    db.session.commit()

    return success(
        data={
            "session_id":    session_id,
            "updated_count": len(updated),
            "updates":       updated,
            "errors":        errors
        },
        message = f"{len(updated)} record(s) updated successfully"
    )