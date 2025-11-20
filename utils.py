# utils.py
from itsdangerous import URLSafeTimedSerializer
from flask import current_app

TOKEN_SALT = "password-reset-salt"

def generate_reset_token(email):
    s = URLSafeTimedSerializer(current_app.config["SECRET_KEY"])
    return s.dumps(email, salt=TOKEN_SALT)

def verify_reset_token(token, max_age=3600):
    s = URLSafeTimedSerializer(current_app.config["SECRET_KEY"])
    try:
        email = s.loads(token, salt=TOKEN_SALT, max_age=max_age)
    except Exception:
        return None
    return email
