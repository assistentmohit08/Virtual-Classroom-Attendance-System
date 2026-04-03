from flask import Flask, render_template
from flask_bcrypt import Bcrypt
from flask_cors import CORS
from config import Config
from models import (db, User, Class, Student, FaceEmbedding,
                    AttendanceSession, AttendanceRecord, StudentProfile)

bcrypt = Bcrypt()

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    db.init_app(app)
    bcrypt.init_app(app)
    CORS(app, supports_credentials=True, origins=["http://localhost:5173", "http://127.0.0.1:5173"])

    from routes.auth_routes    import auth_bp
    from routes.class_routes   import class_bp
    from routes.student_routes import student_bp
    from routes.teacher_routes import teacher_bp

    app.register_blueprint(auth_bp,    url_prefix="/api/auth")
    app.register_blueprint(class_bp,   url_prefix="/api/classes")
    app.register_blueprint(student_bp, url_prefix="/api/student")
    app.register_blueprint(teacher_bp, url_prefix="/api/teacher")

    # Frontend routes are now handled by the separate React application (Vite)

    return app

if __name__ == "__main__":
    app = create_app()
    with app.app_context():
        db.create_all()
        print("✅ Database tables ready.")
    app.run(debug=True)