from flask import jsonify

def success(data=None, message="Success", status=200):
    response = {
        "status":  "success",
        "message": message,
        "data":    data
    }
    return jsonify(response), status

def error(message="Something went wrong", status=400):
    response = {
        "status":  "error",
        "message": message
    }
    return jsonify(response), status
    