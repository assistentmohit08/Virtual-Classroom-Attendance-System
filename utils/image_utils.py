import os
from PIL import Image

ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png"}
MAX_FILE_SIZE_MB   = 10

def allowed_file(filename):
    """Check if file extension is allowed"""
    return "." in filename and \
           filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS

def validate_image(file):
    """
    Validate uploaded image file.
    Returns: (True, None) or (False, error_message)
    """
    # Check filename
    if not file or file.filename == "":
        return False, "No file selected"

    # Check extension
    if not allowed_file(file.filename):
        return False, "Invalid file type. Only JPG, JPEG, PNG allowed"

    # Check file size
    file.seek(0, os.SEEK_END)
    size_mb = file.tell() / (1024 * 1024)
    file.seek(0)
    if size_mb > MAX_FILE_SIZE_MB:
        return False, f"File too large. Max size is {MAX_FILE_SIZE_MB}MB"

    # Check it's actually a valid image
    try:
        img = Image.open(file)
        img.verify()
        file.seek(0)
    except Exception:
        return False, "Corrupted or invalid image file"

    return True, None