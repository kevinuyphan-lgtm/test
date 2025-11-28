from flask import Flask
from system.extensions import db, bcrypt, migrate
from system.config import Config

from system.auth import auth_bp
from system.services import services_bp
from system.invoice import faktura_bp
from system.password_reset import password_reset_bp
from system.kunde import kunde_bp

# -------------------------------
# FLASK APP INIT
# -------------------------------
app = Flask(__name__)
app.config.from_object(Config)

# -------------------------------
# REGISTER EXTENSIONS
# -------------------------------
db.init_app(app)
bcrypt.init_app(app)
migrate.init_app(app, db)

# -------------------------------
# REGISTER BLUEPRINTS
# -------------------------------
app.register_blueprint(auth_bp)
app.register_blueprint(services_bp)
app.register_blueprint(faktura_bp)
app.register_blueprint(password_reset_bp)
app.register_blueprint(kunde_bp)

# -------------------------------
# RUN APP
# -------------------------------
if __name__ == "__main__":
    app.run(debug=True)
