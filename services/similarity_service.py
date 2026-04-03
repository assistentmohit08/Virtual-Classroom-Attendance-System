import numpy as np
from scipy.spatial.distance import cosine


def cosine_sim(vec1, vec2):
    """
    Compute cosine similarity between two face embeddings.
    Returns value between 0.0 and 1.0
    Higher = more similar
    """
    # scipy cosine returns DISTANCE (0=identical), so we convert to similarity
    distance = cosine(vec1, vec2)
    similarity = 1 - distance
    return float(similarity)


def find_best_match(face_vec, candidates, threshold=0.45):
    """
    Compare one detected face against all enrolled student embeddings.

    Args:
        face_vec   : 512D numpy array from classroom photo
        candidates : dict of { student_id: embedding_array }
        threshold  : minimum similarity to count as a match

    Returns:
        (student_id, similarity_score) if match found
        None if no match above threshold
    """
    best_id    = None
    best_score = -1

    for student_id, stored_vec in candidates.items():
        score = cosine_sim(face_vec, stored_vec)
        if score > best_score:
            best_score = score
            best_id    = student_id

    if best_score >= threshold:
        return best_id, round(best_score, 4)

    return None  # No confident match found