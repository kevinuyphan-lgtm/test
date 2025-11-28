import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

class Config:
    SECRET_KEY = "super_secret_key"
    SQLALCHEMY_DATABASE_URI = os.environ.get("DATABASE_URL") or f"sqlite:///{os.path.join(BASE_DIR, 'instance', 'fakturaer.db')}"
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    PDF_FOLDER = os.environ.get("PDF_FOLDER_PATH", "/mnt/pdf_storage")
    ADMIN_EMAILS = {"kevinuyphan3@gmail.com"}
