# 🎓 AttendAI — Virtual Attendance System

A full-stack AI-powered attendance management system that uses **face recognition** to automate student attendance. Teachers upload a class photo, the system detects and matches faces against registered student embeddings, and attendance is recorded automatically.

---

## 📌 Project Overview

| Layer | Technology |
|-------|-----------|
| **Backend** | Python · Flask · SQLAlchemy |
| **Frontend** | React · TypeScript · Vite · TailwindCSS |
| **Database** | MySQL (via PyMySQL) |
| **Face Recognition** | DeepFace / face_recognition / OpenCV |
| **Auth** | Flask-Bcrypt (password hashing) · Session-based |
| **API Style** | RESTful JSON API with CORS |

---

## 🗂️ Project Structure

```
attendance-system/
│
├── app.py                  # Flask app factory — registers all blueprints
├── config.py               # Loads config from .env (DB, secret, thresholds)
├── models.py               # All SQLAlchemy database models (7 tables)
│
├── routes/                 # API route blueprints
│   ├── auth_routes.py      # /api/auth  — login, register, logout
│   ├── class_routes.py     # /api/classes — create/manage classes
│   ├── student_routes.py   # /api/student — student dashboard, profile
│   └── teacher_routes.py   # /api/teacher — upload photo, take attendance
│
├── services/               # Business logic layer
│   ├── attendance_service.py   # Save/update attendance records
│   ├── face_service.py         # Face detection & embedding extraction
│   └── similarity_service.py   # Compare embeddings to find matches
│
├── utils/
│   ├── image_utils.py      # Image pre-processing helpers
│   └── response_utils.py   # Standardized JSON response builder
│
├── static/
│   └── uploads/            # Uploaded class photos (NOT pushed to git)
│
├── frontend/               # React + TypeScript frontend (Vite)
│   ├── src/
│   │   ├── pages/          # Landing, Login, Register, Dashboards, Report
│   │   ├── components/     # Navbar, Toast, StatusBadge, StudentCard, etc.
│   │   ├── context/        # AuthContext (global auth state)
│   │   ├── services/       # API service files (axios calls)
│   │   └── types/          # TypeScript interfaces
│   └── ...config files
│
├── requirements.txt        # Python dependencies
├── .env.example            # Environment variable template
└── .gitignore              # Files excluded from git
```

---

## 🔄 How the System Works (Workflow)

### 1️⃣ Registration & Setup

```
Teacher registers → Creates a Class → Students enroll in the class
Student registers → Uploads face photos → System stores face embeddings in DB
```

### 2️⃣ Taking Attendance (Teacher Flow)

```
Teacher logs in
    └──▶ Goes to Dashboard
            └──▶ Selects a Class
                    └──▶ Uploads a group photo of the class
                            └──▶ Backend detects all faces in the photo
                                    └──▶ Compares each detected face against
                                         stored face embeddings (cosine similarity)
                                              └──▶ Matched students → marked PRESENT
                                                   Unmatched students → marked ABSENT
                                                        └──▶ Attendance session saved to DB
```

### 3️⃣ Review & Override (Teacher Report)

```
Teacher views Attendance Report
    └──▶ Sees each student's status (Present / Absent)
            └──▶ Can manually toggle status via confirmation modal
                    └──▶ Changes saved instantly to DB
```

### 4️⃣ Student Dashboard

```
Student logs in
    └──▶ Sees personal attendance summary
            └──▶ Total sessions, present count, attendance percentage
                    └──▶ Per-session history with dates
```

---

## 🗃️ Database Schema (7 Tables)

```
users ──────────────────────────────────────────────────┐
  id, name, email, password, role (student/teacher)      │
                                                          │
classes ────────────────────────────────────────────────┤
  id, class_name, teacher_id(FK→users)                   │
                                                          │
students ───────────────────────────────────────────────┤
  id, user_id(FK→users), class_id(FK→classes), roll_no   │
                                                          │
face_embeddings ─────────────────────────────────────────┤
  id, student_id(FK→students), embedding_json            │
                                                          │
attendance_session ──────────────────────────────────────┤
  id, class_id, teacher_id, date, image_path             │
                                                          │
attendance_record ───────────────────────────────────────┤
  id, session_id, student_id, status (present/absent)    │
                                                          │
student_profiles ────────────────────────────────────────┘
  id, student_id, phone, address, dob, profile_photo
```

---

## 🚀 Getting Started

### Prerequisites
- Python 3.9+
- Node.js 18+
- MySQL Server running locally

---

### 🔧 Backend Setup

```bash
# 1. Clone the repository
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git
cd YOUR_REPO

# 2. Create and activate virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Mac/Linux

# 3. Install Python dependencies
pip install -r requirements.txt

# 4. Create your .env file from the template
copy .env.example .env       # Windows
# cp .env.example .env       # Mac/Linux

# 5. Edit .env with your MySQL credentials (see .env.example)

# 6. Create the MySQL database
# Open MySQL and run:
#   CREATE DATABASE attendance_db;

# 7. Start the Flask backend (auto-creates all tables)
python app.py
```

Backend runs at: `http://localhost:5000`

---

### 🎨 Frontend Setup

```bash
# In a new terminal
cd frontend

# Install Node dependencies
npm install

# Start the React dev server
npm run dev
```

Frontend runs at: `http://localhost:5173`

---

### ⚙️ Environment Variables (`.env`)

Copy `.env.example` to `.env` and fill in your values:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_mysql_username
DB_PASSWORD=your_mysql_password
DB_NAME=attendance_db
SECRET_KEY=change_this_to_a_random_secret_key
UPLOAD_FOLDER=static/uploads
FACE_SIMILARITY_THRESHOLD=0.45
```

> **FACE_SIMILARITY_THRESHOLD**: Controls how strict face matching is.
> Lower = stricter (0.3), Higher = more lenient (0.6). Default is `0.45`.

---

## 🌐 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Login and get session |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/classes` | Get all classes for teacher |
| POST | `/api/classes` | Create a new class |
| GET | `/api/student/dashboard` | Student's attendance summary |
| POST | `/api/teacher/upload` | Upload class photo & run face recognition |
| GET | `/api/teacher/report/<class_id>` | Get attendance report for a class |
| PUT | `/api/teacher/attendance/<id>` | Override a student's attendance status |

---

## 🔐 Security Notes

- Passwords are hashed using **bcrypt** — never stored in plain text
- `.env` file is **gitignored** — never commit secrets
- `static/uploads/` is **gitignored** — biometric images stay local
- Face embeddings are stored as JSON vectors — not raw images

---

## 👤 User Roles

| Role | Capabilities |
|------|-------------|
| **Teacher** | Create classes · Upload photos · Take attendance · View & override reports |
| **Student** | View own attendance history · See percentage · Profile management |

---

## 📦 Key Dependencies

### Backend
- `Flask` — Web framework
- `Flask-SQLAlchemy` — ORM for MySQL
- `Flask-Bcrypt` — Password hashing
- `Flask-CORS` — Cross-origin requests from React
- `PyMySQL` — MySQL connector
- `python-dotenv` — Load `.env` variables
- `DeepFace` / `face_recognition` — Face embedding & comparison
- `OpenCV` — Image processing
- `NumPy` — Embedding math (cosine similarity)

### Frontend
- `React 18` + `TypeScript`
- `Vite` — Fast dev server & bundler
- `TailwindCSS` — Utility-first styling
- `Axios` — HTTP client for API calls
- `React Router` — Client-side routing

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m "Add your feature"`
4. Push to branch: `git push origin feature/your-feature`
5. Open a Pull Request

---

## 📄 License

This project is for educational purposes. All rights reserved.

---

> Built with ❤️ using Flask + React + Face Recognition AI
