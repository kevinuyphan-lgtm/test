from flask import Flask, render_template, request, redirect, url_for, flash, session, send_from_directory, send_file, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from datetime import datetime, timedelta
import os
from generate_pdf import generate_invoice_pdf
from itsdangerous import URLSafeTimedSerializer, BadSignature, SignatureExpired
from flask_migrate import Migrate

# -------------------------------
# BASE PATHS
# -------------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
INSTANCE_PATH = os.path.join(BASE_DIR, 'instance')
os.makedirs(INSTANCE_PATH, exist_ok=True)

PDF_FOLDER = os.path.join(BASE_DIR, 'lagret_faktura')
os.makedirs(PDF_FOLDER, exist_ok=True)

# -------------------------------
# FLASK APP CONFIG
# -------------------------------
app = Flask(
    __name__,
    template_folder=os.path.join(BASE_DIR, "nettside", "templates"),
    static_folder=os.path.join(BASE_DIR, "nettside", "static")
)
app.secret_key = "super_secret_key"

ADMIN_EMAILS = {"kevinuyphan3@gmail.com"}

# Database
db_url = os.environ.get("DATABASE_URL")
if db_url:
    db_url = db_url.replace("postgres://", "postgresql://", 1)
else:
    db_url = 'sqlite:///' + os.path.join(INSTANCE_PATH, 'fakturaer.db')

app.config['SQLALCHEMY_DATABASE_URI'] = db_url
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)
bcrypt = Bcrypt(app)
serializer = URLSafeTimedSerializer(app.secret_key)
migrate = Migrate(app, db)

# -------------------------------
# MODELS
# -------------------------------
class Bruker(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    navn = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password_hash = db.Column(db.String(200), nullable=False)
    faktura_teller = db.Column(db.Integer, default=1000)
    fakturaer = db.relationship('Faktura', backref='bruker', lazy=True)
    kunder = db.relationship('Kunde', backref='bruker', lazy=True)

class Kunde(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    navn = db.Column(db.String(150), nullable=False)
    firmanavn = db.Column(db.String(150), nullable=True)
    epost = db.Column(db.String(150), nullable=True)
    telefon = db.Column(db.String(50), nullable=True)
    adresse = db.Column(db.String(200), nullable=True)
    orgnr = db.Column(db.String(50), nullable=True)
    referanse = db.Column(db.String(100), nullable=True)
    user_id = db.Column(db.Integer, db.ForeignKey('bruker.id'), nullable=False)

class Faktura(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    filnavn = db.Column(db.String(100), nullable=False)
    dato = db.Column(db.DateTime, default=datetime.utcnow)
    status = db.Column(db.String(20), default="utkast")  # utkast → sendt → betalt
    betalt_dato = db.Column(db.DateTime, nullable=True)
    user_id = db.Column(db.Integer, db.ForeignKey('bruker.id'), nullable=False)

# -------------------------------
# HELPER FUNCTIONS
# -------------------------------
def current_user():
    uid = session.get("user_id")
    if not uid:
        return None
    return Bruker.query.get(uid)

def is_admin():
    user = current_user()
    return bool(user and user.email in ADMIN_EMAILS)

def generate_reset_token(user_id):
    return serializer.dumps({"user_id": user_id})

def verify_reset_token(token, max_age_seconds=3600):
    try:
        data = serializer.loads(token, max_age=max_age_seconds)
        return data.get("user_id")
    except (BadSignature, SignatureExpired):
        return None

# -------------------------------
# ROUTES: AUTH
# -------------------------------
@app.route("/")
def index():
    return render_template("index.html")

@app.route("/register", methods=["GET", "POST"])
def register():
    if request.method == "POST":
        name = request.form.get("name")
        email = request.form.get("email")
        password = request.form.get("password")
        confirm_password = request.form.get("confirm_password")
        if password != confirm_password:
            flash("Passordene samsvarer ikke!", "error")
            return redirect(url_for("register"))
        if Bruker.query.filter_by(email=email).first():
            flash("Epost allerede registrert!", "error")
            return redirect(url_for("register"))
        password_hash = bcrypt.generate_password_hash(password).decode("utf-8")
        ny_bruker = Bruker(navn=name, email=email, password_hash=password_hash)
        db.session.add(ny_bruker)
        db.session.commit()
        flash("Registrering vellykket! Du kan nå logge inn ✅", "success")
        return redirect(url_for("login"))
    return render_template("register.html")

@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        email = request.form.get("email")
        password = request.form.get("password")
        user = Bruker.query.filter_by(email=email).first()
        if user and bcrypt.check_password_hash(user.password_hash, password):
            session['user'] = user.navn
            session['user_id'] = user.id
            flash("Velkommen tilbake!", "success")
            return redirect(url_for("tjenester"))
        else:
            flash("Feil epost eller passord", "error")
            return redirect(url_for("login"))
    return render_template("login.html")

@app.route("/logout")
def logout():
    session.clear()
    flash("Du er nå logget ut 👋", "info")
    return redirect(url_for("login"))

# -------------------------------
# ROUTES: SERVICES
# -------------------------------
@app.route("/om-oss")
def om_oss():
    return render_template("om-oss.html")

@app.route("/kontakt")
def kontakt():
    return render_template("kontakt.html")

@app.route("/tjenester")
def tjenester():
    user = current_user()
    if not user:
        flash("Du må logge inn for å få tilgang til tjenester", "error")
        return redirect(url_for("login"))
    kunder = Kunde.query.filter_by(user_id=user.id).all()
    return render_template("tjenester.html", kunder=kunder)

# -------------------------------
# ROUTES: KUNDE
# -------------------------------
@app.route("/kundeliste")
def kundeliste():
    user = current_user()
    if not user:
        flash("Du må være logget inn for å se kundelisten.", "error")
        return redirect(url_for("login"))
    kunder = Kunde.query.filter_by(user_id=user.id).all()
    return render_template("kundeliste.html", kunder=kunder)

@app.route("/add-kunde", methods=["POST"])
def add_kunde():
    user = current_user()
    if not user:
        return jsonify({"success": False, "message": "Du må være logget inn"}), 401
    data = request.get_json()
    try:
        ny_kunde = Kunde(
            navn=data.get("navn", ""),
            firmanavn=data.get("firma", ""),
            adresse=data.get("adresse", ""),
            orgnr=data.get("orgnr", ""),
            referanse=data.get("referanse", ""),
            telefon=data.get("telefon", ""),
            epost=data.get("epost", ""),
            user_id=user.id
        )
        db.session.add(ny_kunde)
        db.session.commit()
        return jsonify({
            "success": True,
            "kunde": {
                "id": ny_kunde.id,
                "navn": ny_kunde.navn,
                "firma": ny_kunde.firmanavn,
                "adresse": ny_kunde.adresse,
                "orgnr": ny_kunde.orgnr,
                "referanse": ny_kunde.referanse,
                "telefon": ny_kunde.telefon,
                "epost": ny_kunde.epost
            }
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": str(e)}), 500

@app.route("/update-kunde/<int:kunde_id>", methods=["POST"])
def update_kunde(kunde_id):
    user = current_user()
    if not user:
        return jsonify({"success": False, "message": "Du må være logget inn"}), 401
    kunde = Kunde.query.get_or_404(kunde_id)
    if kunde.user_id != user.id:
        return jsonify({"success": False, "message": "Ingen tilgang"}), 403
    data = request.get_json()
    try:
        kunde.navn = data.get("navn", kunde.navn)
        kunde.firmanavn = data.get("firma", kunde.firmanavn)
        kunde.adresse = data.get("adresse", kunde.adresse)
        kunde.orgnr = data.get("orgnr", kunde.orgnr)
        kunde.referanse = data.get("referanse", kunde.referanse)
        kunde.telefon = data.get("telefon", kunde.telefon)
        kunde.epost = data.get("epost", kunde.epost)
        db.session.commit()
        return jsonify({
            "success": True,
            "kunde": {
                "id": kunde.id,
                "navn": kunde.navn,
                "firma": kunde.firmanavn,
                "adresse": kunde.adresse,
                "orgnr": kunde.orgnr,
                "referanse": kunde.referanse,
                "telefon": kunde.telefon,
                "epost": kunde.epost
            }
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": str(e)}), 500

# -------------------------------
# RESTEN AV ROUTES (FAKTURA, PASSWORD RESET) SAMME SOM FØR
# -------------------------------

# (Hold alle andre faktura- og reset-passord-ruter som de var i din originale fil)
# Jeg hopper over dem her for korthet, men behold dem i app.py

# -------------------------------
# RUN LOCAL
# -------------------------------
if __name__ == "__main__":
    app.run(debug=True)
