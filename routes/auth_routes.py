
from flask import Blueprint, request, session
from flask_bcrypt import Bcrypt
from models import db, User
from utils.response_utils import success, error

auth_bp = Blueprint("auth", __name__)
bcrypt  = Bcrypt()

# ─────────────────────────────────────────
# POST /api/auth/register
# ─────────────────────────────────────────
@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json()

    # Validate required fields
    required = ["name", "email", "password", "role"]
    for field in required:
        if not data.get(field):
            return error(f"'{field}' is required")

    # Validate role
    if data["role"] not in ["student", "teacher"]:
        return error("Role must be 'student' or 'teacher'")

    # Check duplicate email
    existing = User.query.filter_by(email=data["email"]).first()
    if existing:
        return error("Email already registered", 409)

    # Hash password
    hashed = bcrypt.generate_password_hash(data["password"]).decode("utf-8")

    # Create user
    user = User(
        name     = data["name"],
        email    = data["email"],
        password = hashed,
        role     = data["role"]
    )
    db.session.add(user)
    db.session.commit()

    return success(
        data    = user.to_dict(),
        message = "User registered successfully",
        status  = 201
    )


# ─────────────────────────────────────────
# POST /api/auth/login
# ─────────────────────────────────────────
@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()

    if not data.get("email") or not data.get("password"):
        return error("Email and password are required")

    # Find user
    user = User.query.filter_by(email=data["email"]).first()
    if not user:
        return error("Invalid email or password", 401)

    # Verify password
    if not bcrypt.check_password_hash(user.password, data["password"]):
        return error("Invalid email or password", 401)

    # Create session
    session["user_id"] = user.id
    session["role"]    = user.role
    session["name"]    = user.name

    return success(
        data    = user.to_dict(),
        message = f"Welcome {user.name}!"
    )


# ─────────────────────────────────────────
# POST /api/auth/logout
# ─────────────────────────────────────────
@auth_bp.route("/logout", methods=["POST"])
def logout():
    session.clear()
    return success(message="Logged out successfully")


# ─────────────────────────────────────────
# GET /api/auth/me
# Check who is currently logged in
# ─────────────────────────────────────────
@auth_bp.route("/me", methods=["GET"])
def me():
    if "user_id" not in session:
        return error("Not logged in", 401)

    user = User.query.get(session["user_id"])
    if not user:
        return error("User not found", 404)

    return success(data=user.to_dict())