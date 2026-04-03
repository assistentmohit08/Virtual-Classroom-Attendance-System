from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import json
import numpy as np

db = SQLAlchemy()

# ─────────────────────────────────────────
# TABLE 1 — USERS
# ─────────────────────────────────────────
class User(db.Model):
    __tablename__ = "users"

    id         = db.Column(db.Integer, primary_key=True)
    name       = db.Column(db.String(100), nullable=False)
    email      = db.Column(db.String(100), unique=True, nullable=False)
    password   = db.Column(db.String(255), nullable=False)
    role       = db.Column(db.Enum("student", "teacher"), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    student_profile    = db.relationship("Student", backref="user", uselist=False)
    classes_taught     = db.relationship("Class", backref="teacher")
    sessions_conducted = db.relationship("AttendanceSession", backref="teacher")

    def to_dict(self):
        return {
            "id":    self.id,
            "name":  self.name,
            "email": self.email,
            "role":  self.role
        }


# ─────────────────────────────────────────
# TABLE 2 — CLASSES
# ─────────────────────────────────────────
class Class(db.Model):
    __tablename__ = "classes"

    id         = db.Column(db.Integer, primary_key=True)
    class_name = db.Column(db.String(100), nullable=False)
    teacher_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    students = db.relationship("Student", backref="class_")
    sessions = db.relationship("AttendanceSession", backref="class_")

    def to_dict(self):
        return {
            "id":         self.id,
            "class_name": self.class_name,
            "teacher_id": self.teacher_id
        }


# ─────────────────────────────────────────
# TABLE 3 — STUDENTS
# ─────────────────────────────────────────
class Student(db.Model):
    __tablename__ = "students"

    id          = db.Column(db.Integer, primary_key=True)
    user_id     = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    class_id    = db.Column(db.Integer, db.ForeignKey("classes.id"), nullable=False)
    roll_number = db.Column(db.String(20), unique=True, nullable=False)

    # Relationships
    embeddings         = db.relationship("FaceEmbedding", backref="student")
    attendance_records = db.relationship("AttendanceRecord", backref="student")
    extra_profile      = db.relationship("StudentProfile", backref="student", uselist=False) 
    def to_dict(self):
        return {
            "id":          self.id,
            "user_id":     self.user_id,
            "class_id":    self.class_id,
            "roll_number": self.roll_number,
            "name":        self.user.name if self.user else None
        }


# ─────────────────────────────────────────
# TABLE 4 — FACE EMBEDDINGS
# ─────────────────────────────────────────
class FaceEmbedding(db.Model):
    __tablename__ = "face_embeddings"

    id             = db.Column(db.Integer, primary_key=True)
    student_id     = db.Column(db.Integer, db.ForeignKey("students.id"), nullable=False)
    embedding_json = db.Column(db.Text, nullable=False)
    created_at     = db.Column(db.DateTime, default=datetime.utcnow)

    def set_embedding(self, np_array):
        """Save numpy array as JSON string"""
        self.embedding_json = json.dumps(np_array.tolist())

    def get_embedding(self):
        """Load JSON string back as numpy array"""
        return np.array(json.loads(self.embedding_json), dtype=np.float32)

    def to_dict(self):
        return {
            "id":         self.id,
            "student_id": self.student_id,
            "created_at": str(self.created_at)
        }


# ─────────────────────────────────────────
# TABLE 5 — ATTENDANCE SESSION
# ─────────────────────────────────────────
class AttendanceSession(db.Model):
    __tablename__ = "attendance_session"

    id         = db.Column(db.Integer, primary_key=True)
    class_id   = db.Column(db.Integer, db.ForeignKey("classes.id"), nullable=False)
    teacher_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    date       = db.Column(db.Date, nullable=False)
    image_path = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    records = db.relationship("AttendanceRecord", backref="session")

    def to_dict(self):
        return {
            "id":         self.id,
            "class_id":   self.class_id,
            "teacher_id": self.teacher_id,
            "date":       str(self.date),
            "image_path": self.image_path
        }


# ─────────────────────────────────────────
# TABLE 6 — ATTENDANCE RECORD
# ─────────────────────────────────────────
class AttendanceRecord(db.Model):
    __tablename__ = "attendance_record"

    id         = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.Integer, db.ForeignKey("attendance_session.id"), nullable=False)
    student_id = db.Column(db.Integer, db.ForeignKey("students.id"), nullable=False)
    status     = db.Column(db.Enum("present", "absent"), nullable=False)

    def to_dict(self):
        return {
            "id":         self.id,
            "session_id": self.session_id,
            "student_id": self.student_id,
            "status":     self.status
        }

# ─────────────────────────────────────────
# TABLE 7 — STUDENT PROFILES
# ─────────────────────────────────────────
class StudentProfile(db.Model):
    __tablename__ = "student_profiles"

    id            = db.Column(db.Integer, primary_key=True)
    student_id    = db.Column(db.Integer, db.ForeignKey("students.id"),
                              nullable=False, unique=True)
    phone         = db.Column(db.String(15))
    address       = db.Column(db.Text)
    dob           = db.Column(db.Date)
    profile_photo = db.Column(db.String(255))
    updated_at    = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id":            self.id,
            "student_id":    self.student_id,
            "phone":         self.phone,
            "address":       self.address,
            "dob":           str(self.dob) if self.dob else None,
            "profile_photo": self.profile_photo,
            "updated_at":    str(self.updated_at)
        }