from models import db, Student, FaceEmbedding, AttendanceSession, AttendanceRecord
from services.face_service import extract_all_faces
from services.similarity_service import find_best_match
from datetime import date


def take_attendance(image_path, class_id, teacher_id, threshold=0.45):
    """
    Full attendance pipeline:
    1. Detect all faces in classroom image
    2. Fetch all students + embeddings for this class
    3. Match each face against enrolled students
    4. Mark present / absent
    5. Save session + records to database
    6. Return summary
    """

    # ── STEP 1: Detect all faces in classroom photo ──
    print(f"  🔍 Detecting faces in classroom image...")
    classroom_faces = extract_all_faces(image_path)
    print(f"  📸 Faces detected: {len(classroom_faces)}")

    if len(classroom_faces) == 0:
        return {
            "status":        "warning",
            "message":       "No faces detected in classroom image",
            "present_count": 0,
            "absent_count":  0,
            "records":       []
        }

    # ── STEP 2: Fetch all students + embeddings for class ──
    students = Student.query.filter_by(class_id=class_id).all()
    print(f"  👥 Students in class: {len(students)}")

    if len(students) == 0:
        return {
            "status":        "warning",
            "message":       "No students enrolled in this class",
            "present_count": 0,
            "absent_count":  0,
            "records":       []
        }

    # Build candidates dict { student_id: embedding_array }
    candidates = {}
    for student in students:
        embedding = FaceEmbedding.query.filter_by(
            student_id=student.id
        ).first()
        if embedding:
            candidates[student.id] = embedding.get_embedding()

    print(f"  🧠 Students with face enrolled: {len(candidates)}")

    # ── STEP 3: Match each detected face ──
    present_ids = set()
    for i, face_vec in enumerate(classroom_faces):
        result = find_best_match(face_vec, candidates, threshold)
        if result:
            student_id, score = result
            present_ids.add(student_id)
            print(f"  ✅ Face {i+1}: Matched student_id={student_id} score={score}")
        else:
            print(f"  ❓ Face {i+1}: No match found")

    # ── STEP 4: Create attendance session ──
    session = AttendanceSession(
        class_id   = class_id,
        teacher_id = teacher_id,
        date       = date.today(),
        image_path = image_path
    )
    db.session.add(session)
    db.session.flush()  # Get session.id without full commit

    # ── STEP 5: Write present/absent for every student ──
    records = []
    for student in students:
        status = "present" if student.id in present_ids else "absent"

        record = AttendanceRecord(
            session_id = session.id,
            student_id = student.id,
            status     = status
        )
        db.session.add(record)

        records.append({
            "student_id":  student.id,
            "roll_number": student.roll_number,
            "name":        student.user.name if student.user else "Unknown",
            "status":      status
        })

    db.session.commit()
    print(f"  💾 Attendance saved. Present: {len(present_ids)}, Absent: {len(students) - len(present_ids)}")

    # ── STEP 6: Return summary ──
    return {
        "status":        "success",
        "session_id":    session.id,
        "date":          str(date.today()),
        "class_id":      class_id,
        "total_students": len(students),
        "present_count": len(present_ids),
        "absent_count":  len(students) - len(present_ids),
        "faces_detected": len(classroom_faces),
        "records":       records
    }