from services.face_service import (
    extract_embedding,
    extract_all_faces,
    validate_single_face
)
from services.similarity_service import cosine_sim, find_best_match

print("\n=== PHASE 3 — FACE ENGINE TEST ===\n")

# ── TEST 1 ──────────────────────────────
print("TEST 1: Checking single face in student.jpg")
valid, error = validate_single_face("test_data/student.jpg")
if valid:
    print("  ✅ Exactly 1 face found — good to go\n")
else:
    print(f"  ❌ Failed: {error}\n")

# ── TEST 2 ──────────────────────────────
print("TEST 2: Extracting embedding from student.jpg")
emb = extract_embedding("test_data/student.jpg")
if emb is not None:
    print(f"  ✅ Embedding extracted successfully")
    print(f"  Shape : {emb.shape}  ← should be (512,)")
    print(f"  Sample: {emb[:3]}\n")
else:
    print("  ❌ No face found in student.jpg\n")

# ── TEST 3 ──────────────────────────────
print("TEST 3: Detecting all faces in classroom.jpg")
faces = extract_all_faces("test_data/classroom.jpg")
print(f"  ✅ Total faces detected: {len(faces)}\n")

# ── TEST 4 ──────────────────────────────
print("TEST 4: Matching student face against classroom")
if emb is not None and len(faces) > 0:
    candidates = {1: emb}
    for i, face in enumerate(faces):
        result = find_best_match(face, candidates, threshold=0.45)
        score  = cosine_sim(emb, face)
        if result:
            print(f"  ✅ Face {i+1}: MATCHED — score = {round(score, 4)}")
        else:
            print(f"  ❌ Face {i+1}: NO MATCH — score = {round(score, 4)}")
else:
    print("  ⚠️  Skipped — no embedding or no faces detected")

print("\n=== TEST COMPLETE ===\n")