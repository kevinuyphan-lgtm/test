import os

# -------------------------------
# BASE DIR
# -------------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
INSTANCE_DIR = os.path.join(BASE_DIR, "instance")
os.makedirs(INSTANCE_DIR, exist_ok=True)

# -------------------------------
# PDF STORAGE & ADMIN
# -------------------------------
PDF_FOLDER = os.environ.get("PDF_FOLDER_PATH", "/mnt/pdf_storage")
os.makedirs(PDF_FOLDER, exist_ok=True)

ADMIN_EMAILS = {"kevinuyphan3@gmail.com"}

# -------------------------------
# SECRET KEY
# -------------------------------
SECRET_KEY = os.environ.get("SECRET_KEY", "super_secret_key")

# -------------------------------
# CONFIG CLASS
# -------------------------------
class Config:
    SECRET_KEY = SECRET_KEY
    SQLALCHEMY_DATABASE_URI = os.environ.get("DATABASE_URL") or f"sqlite:///{os.path.join(INSTANCE_DIR, 'fakturaer.db')}"
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    PDF_FOLDER = PDF_FOLDER
    ADMIN_EMAILS = ADMIN_EMAILS

    MAIL_SERVER = os.environ.get("MAIL_SERVER")
    MAIL_PORT = int(os.environ.get("MAIL_PORT", 465))
    MAIL_USERNAME = os.environ.get("MAIL_USERNAME")
    MAIL_PASSWORD = os.environ.get("MAIL_PASSWORD")
