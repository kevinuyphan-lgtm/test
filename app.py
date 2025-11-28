from flask import Flask
from system.extensions import db, bcrypt, serializer, migrate
from system.config import PDF_FOLDER, ADMIN_EMAILS

# Importer blueprints fra routes
from routes.auth import auth_bp
from routes.kunde import kunde_bp
from routes.invoice import faktura_bp
from routes.password_reset import password_reset_bp

# -------------------------------
# FLASK APP CONFIG
# -------------------------------
app = Flask(
    __name__,
    template_folder="nettside/templates",
    static_folder="nettside/static"
)
app.secret_key = "super_secret_key"

# Opprett PDF-folder hvis ikke eksisterer
import os
os.makedirs(PDF_FOLDER, exist_ok=True)

# -------------------------------
# DATABASE CONFIG
# -------------------------------
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///instance/fakturaer.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# -------------------------------
# INIT EXTENSIONS
# -------------------------------
db.init_app(app)
bcrypt.init_app(app)
migrate.init_app(app, db)

# -------------------------------
# REGISTER BLUEPRINTS
# -------------------------------
app.register_blueprint(auth_bp)
app.register_blueprint(kunde_bp)
app.register_blueprint(faktura_bp)
app.register_blueprint(password_reset_bp)

# -------------------------------
# KJØR APP
# -------------------------------
if __name__ == "__main__":
    app.run(debug=True)
