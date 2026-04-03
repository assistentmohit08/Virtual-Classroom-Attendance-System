from flask import Blueprint, request, session
from models import db, Class, Student, User
from utils.response_utils import success, error

class_bp = Blueprint("classes", __name__)


# ─────────────────────────────────────────
# HELPER — Check if logged in as teacher
# ─────────────────────────────────────────
def teacher_required():
    if "user_id" not in session:
        return error("Login required", 401)
    if session.get("role") != "teacher":
        return error("Teacher access only", 403)
    return None


# ─────────────────────────────────────────
# POST /api/classes/create
# Teacher creates a new class
# ─────────────────────────────────────────
@class_bp.route("/create", methods=["POST"])
def create_class():
    # Auth check
    auth_error = teacher_required()
    if auth_error:
        return auth_error

    data = request.get_json()

    if not data.get("class_name"):
        return error("'class_name' is required")

    # Check duplicate class name for this teacher
    existing = Class.query.filter_by(
        class_name = data["class_name"],
        teacher_id = session["user_id"]
    ).first()
    if existing:
        return error("You already have a class with this name", 409)

    # Create class
    new_class = Class(
        class_name = data["class_name"],
        teacher_id = session["user_id"]
    )
    db.session.add(new_class)
    db.session.commit()

    return success(
        data    = new_class.to_dict(),
        message = f"Class '{new_class.class_name}' created successfully",
        status  = 201
    )


# ─────────────────────────────────────────
# GET /api/classes/my-classes
# Teacher views all their classes
# ─────────────────────────────────────────
@class_bp.route("/my-classes", methods=["GET"])
def my_classes():
    auth_error = teacher_required()
    if auth_error:
        return auth_error

    classes = Class.query.filter_by(
        teacher_id=session["user_id"]
    ).all()

    return success(
        data = [c.to_dict() for c in classes],
        message = f"{len(classes)} class(es) found"
    )


# ─────────────────────────────────────────
# GET /api/classes/<class_id>/students
# Teacher views all students in a class
# ─────────────────────────────────────────
@class_bp.route("/<int:class_id>/students", methods=["GET"])
def get_students(class_id):
    auth_error = teacher_required()
    if auth_error:
        return auth_error

    # Verify class belongs to this teacher
    class_ = Class.query.filter_by(
        id         = class_id,
        teacher_id = session["user_id"]
    ).first()
    if not class_:
        return error("Class not found", 404)

    students = Student.query.filter_by(class_id=class_id).all()

    return success(
        data    = [s.to_dict() for s in students],
        message = f"{len(students)} student(s) in {class_.class_name}"
    )


# ─────────────────────────────────────────
# POST /api/classes/enroll
# Teacher enrolls a student into a class
# ─────────────────────────────────────────
@class_bp.route("/enroll", methods=["POST"])
def enroll_student():
    auth_error = teacher_required()
    if auth_error:
        return auth_error

    data = request.get_json()

    # Validate required fields
    required = ["user_id", "class_id", "roll_number"]
    for field in required:
        if not data.get(field):
            return error(f"'{field}' is required")

    # Check user exists and is a student
    user = User.query.get(data["user_id"])
    if not user:
        return error("User not found", 404)
    if user.role != "student":
        return error("User is not a student", 400)

    # Check class exists and belongs to this teacher
    class_ = Class.query.filter_by(
        id         = data["class_id"],
        teacher_id = session["user_id"]
    ).first()
    if not class_:
        return error("Class not found or not yours", 404)

    # Check student not already enrolled in this class
    already = Student.query.filter_by(
        user_id  = data["user_id"],
        class_id = data["class_id"]
    ).first()
    if already:
        return error("Student already enrolled in this class", 409)

    # Check roll number not already taken
    roll_taken = Student.query.filter_by(
        roll_number=data["roll_number"]
    ).first()
    if roll_taken:
        return error("Roll number already taken", 409)

    # Enroll student
    student = Student(
        user_id     = data["user_id"],
        class_id    = data["class_id"],
        roll_number = data["roll_number"]
    )
    db.session.add(student)
    db.session.commit()

    return success(
        data    = student.to_dict(),
        message = f"Student enrolled in {class_.class_name}",
        status  = 201
    )