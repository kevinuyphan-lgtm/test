from flask import Flask
from system.extensions import db, bcrypt, serializer, migrate
from system.config import Config, PDF_FOLDER

# Importer blueprints
from routes.auth import auth_bp
from routes.kunde import kunde_bp
from routes.invoice import faktura_bp
from routes.password_reset import password_reset_bp

import os

# -------------------------------
# FLASK APP CONFIG
# -------------------------------
app = Flask(
    __name__,
    template_folder="nettside/templates",
    static_folder="nettside/static"
)

# Bruk Config-klassen
app.config.from_object(Config)

# Opprett PDF-folder hvis ikke eksisterer
os.makedirs(PDF_FOLDER, exist_ok=True)

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
