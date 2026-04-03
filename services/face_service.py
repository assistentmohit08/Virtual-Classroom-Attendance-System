import cv2
import numpy as np
from deepface import DeepFace

# ─────────────────────────────────────────
# CONFIG
# Using DeepFace with:
#   Detection  → RetinaFace
#   Recognition → ArcFace
#   Both free, no C++ needed on Windows
# ─────────────────────────────────────────
DETECTOR  = "retinaface"
MODEL     = "ArcFace"


def load_image(image_path):
    """Load and return image as RGB numpy array"""
    img = cv2.imread(image_path)
    if img is None:
        raise ValueError(f"Could not load image: {image_path}")
    return cv2.cvtColor(img, cv2.COLOR_BGR2RGB)


def extract_embedding(image_path):
    """
    Extract ONE face embedding from a single-person image.
    Used during student enrollment.
    Returns: 512D numpy array or None if no face found
    """
    try:
        result = DeepFace.represent(
            img_path    = image_path,
            model_name  = MODEL,
            detector_backend = DETECTOR,
            enforce_detection = True
        )
        embedding = np.array(result[0]["embedding"], dtype=np.float32)
        # L2 normalise
        norm = np.linalg.norm(embedding)
        return embedding / norm if norm > 0 else embedding

    except Exception as e:
        print(f"  ⚠️  extract_embedding error: {e}")
        return None


def extract_all_faces(image_path):
    """
    Extract embeddings for ALL faces in a classroom image.
    Used during attendance taking.
    Returns: list of 512D numpy arrays
    """
    try:
        results = DeepFace.represent(
            img_path    = image_path,
            model_name  = MODEL,
            detector_backend = DETECTOR,
            enforce_detection = False
        )
        embeddings = []
        for r in results:
            emb  = np.array(r["embedding"], dtype=np.float32)
            norm = np.linalg.norm(emb)
            embeddings.append(emb / norm if norm > 0 else emb)
        return embeddings

    except Exception as e:
        print(f"  ⚠️  extract_all_faces error: {e}")
        return []


def validate_single_face(image_path):
    """
    Check image contains EXACTLY one face.
    Returns: (True, None) or (False, error_message)
    """
    try:
        results = DeepFace.represent(
            img_path    = image_path,
            model_name  = MODEL,
            detector_backend = DETECTOR,
            enforce_detection = True
        )
        if len(results) == 0:
            return False, "No face detected in image"
        if len(results) > 1:
            return False, f"Multiple faces detected ({len(results)}). Upload a solo photo"
        return True, None

    except Exception as e:
        return False, f"Face detection failed: {str(e)}"


def average_embeddings(embedding_list):
    """
    Average multiple embeddings into one normalised vector.
    Used after extracting from 3 enrollment photos.
    Returns: single 512D normalised numpy array
    """
    stacked = np.stack(embedding_list, axis=0)
    avg     = np.mean(stacked, axis=0)
    norm    = np.linalg.norm(avg)
    return (avg / norm).astype(np.float32) if norm > 0 else avg.astype(np.float32)