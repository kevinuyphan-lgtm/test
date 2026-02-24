import smtplib
import os
from email.message import EmailMessage
from system.config import Config
from itsdangerous import URLSafeTimedSerializer
from flask import current_app


def generate_reset_token(email):
    serializer = URLSafeTimedSerializer(current_app.config["SECRET_KEY"])
    return serializer.dumps(email, salt="password-reset-salt")


def verify_reset_token(token, expiration=3600):
    serializer = URLSafeTimedSerializer(current_app.config["SECRET_KEY"])
    try:
        email = serializer.loads(
            token,
            salt="password-reset-salt",
            max_age=expiration
        )
    except Exception:
        return None
    return email


def send_email(subject, to_email, html_content, attachments=None):
    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = Config.MAIL_USERNAME
    msg["To"] = to_email

    msg.set_content("Dette er en HTML e-post.")
    msg.add_alternative(html_content, subtype="html")

    if attachments:
        for filepath in attachments:
            with open(filepath, "rb") as f:
                file_data = f.read()
                file_name = os.path.basename(filepath)

            msg.add_attachment(
                file_data,
                maintype="application",
                subtype="pdf",
                filename=file_name,
            )

    with smtplib.SMTP_SSL(Config.MAIL_SERVER, Config.MAIL_PORT) as server:
        server.login(Config.MAIL_USERNAME, Config.MAIL_PASSWORD)
        server.send_message(msg)
