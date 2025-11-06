from flask import Flask, render_template, request, redirect, url_for, flash, session, send_from_directory, send_file
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from datetime import datetime
import os
from generate_pdf import generate_invoice_pdf
from itsdangerous import URLSafeTimedSerializer, BadSignature, SignatureExpired

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

app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get("DATABASE_URL").replace("postgres://", "postgresql://", 1)
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)
bcrypt = Bcrypt(app)
serializer = URLSafeTimedSerializer(app.secret_key)

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
    user_id = db.Column(db.Integer, db.ForeignKey('bruker.id'), nullable=False)

# -------------------------------
# CREATE DB & TEST USER
# -------------------------------
with app.app_context():
    db.create_all()  # Lager bare tabeller som ikke finnes

    # Lag testbruker om den ikke finnes
    if not Bruker.query.filter_by(email="test@localhost").first():
        pw_hash = bcrypt.generate_password_hash("123456").decode("utf-8")
        test_user = Bruker(navn="Test Bruker", email="test@localhost", password_hash=pw_hash)
        db.session.add(test_user)
        db.session.commit()
        print("Testbruker opprettet: test@localhost / 123456")

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
# CREATE DB & TEST USER
# -------------------------------
with app.app_context():
    db.create_all()
    # Lag testbruker om den ikke finnes
    if not Bruker.query.filter_by(email="test@localhost").first():
        pw_hash = bcrypt.generate_password_hash("123456").decode("utf-8")
        test_user = Bruker(navn="Test Bruker", email="test@localhost", password_hash=pw_hash)
        db.session.add(test_user)
        db.session.commit()
        print("Testbruker opprettet: test@localhost / 123456")

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
@app.route("/tjenester")
def tjenester():
    if not current_user():
        flash("Du må logge inn for å få tilgang til tjenester", "error")
        return redirect(url_for("login"))
    return render_template("tjenester.html")

@app.route("/om-oss")
def om_oss():
    return render_template("om-oss.html")

@app.route("/kontakt")
def kontakt():
    return render_template("kontakt.html")

# -------------------------------
# ROUTES: INVOICES
# -------------------------------
@app.route("/generate-invoice", methods=["POST"])
def generate_invoice():
    user = current_user()
    if not user:
        flash("Du må logge inn for å generere faktura", "error")
        return redirect(url_for("login"))

    fakturanummer = user.faktura_teller
    user.faktura_teller += 1
    db.session.commit()

    invoice_data = {
        "invoice_number": fakturanummer,
        "firmanavn": request.form.get("firmanavn"),
        "firmaadresse": request.form.get("firmaadresse"),
        "orgnr": request.form.get("orgnr"),
        "referanse": request.form.get("referanse"),
        "invoice_date": request.form.get("invoice_date"),
        "due_date": request.form.get("due_date"),
        "produkter": [
            {"navn": n, "antall": a, "pris": p}
            for n, a, p in zip(
                request.form.getlist("produkt_navn[]"),
                request.form.getlist("produkt_antall[]"),
                request.form.getlist("produkt_pris[]")
            )
        ]
    }

    user_folder = os.path.join(PDF_FOLDER, f"user_{user.id}")
    os.makedirs(user_folder, exist_ok=True)

    filename = f"faktura_{fakturanummer}.pdf"
    filepath = os.path.join(user_folder, filename)

    pdf_buffer = generate_invoice_pdf(invoice_data)
    with open(filepath, "wb") as f:
        f.write(pdf_buffer.getbuffer())

    faktura = Faktura(filnavn=filename, user_id=user.id)
    db.session.add(faktura)
    db.session.commit()

    pdf_buffer.seek(0)
    return send_file(pdf_buffer, as_attachment=True, download_name=filename)

@app.route("/fakturaer")
def fakturaer():
    user = current_user()
    if not user:
        flash("Du må logge inn for å se fakturaene dine", "error")
        return redirect(url_for("login"))
    bruker_fakturaer = Faktura.query.filter_by(user_id=user.id).all()
    return render_template("fakturaer.html", fakturaer=bruker_fakturaer)

@app.route("/kundeliste")
def kundeliste():
    user = current_user()
    if not user:
        flash("Du må være logget inn for å se kundelisten.", "error")
        return redirect(url_for("login"))

    kunder = Kunde.query.filter_by(user_id=user.id).all()
    return render_template("kundeliste.html", kunder=kunder)

@app.route("/ny-kunde", methods=["GET", "POST"])
def ny_kunde():
    user = current_user()
    if not user:
        flash("Du må være logget inn for å legge til kunder.", "error")
        return redirect(url_for("login"))

    if request.method == "POST":
        ny = Kunde(
            navn = request.form.get("navn"),
            adresse = request.form.get("adresse"),
            orgnr = request.form.get("orgnr"),
            referanse = request.form.get("referanse"),
            user_id = user.id
        )
        db.session.add(ny)
        db.session.commit()
        flash("Kunde lagt til ✅", "success")
        return redirect(url_for("kundeliste"))


    return render_template("ny_kunde.html")


@app.route("/download/<int:faktura_id>")
def download_faktura(faktura_id):
    faktura = Faktura.query.get_or_404(faktura_id)
    user = current_user()
    if not user or faktura.user_id != user.id:
        flash("Du har ikke tilgang til denne filen", "error")
        return redirect(url_for("tjenester"))
    user_folder = os.path.join(PDF_FOLDER, f"user_{user.id}")
    return send_from_directory(user_folder, faktura.filnavn, as_attachment=True)

# -------------------------------
# PASSWORD RESET
# -------------------------------
@app.route("/forgot-password", methods=["GET", "POST"])
def forgot_password():
    if request.method == "POST":
        email = request.form.get("email", "").strip()
        user = Bruker.query.filter_by(email=email).first()
        flash("Hvis eposten finnes, har vi sendt en reset-link (se serverloggen).", "info")
        if user:
            token = generate_reset_token(user.id)
            reset_link = url_for("reset_with_token", token=token, _external=True)
            print(f"[DEBUG] Reset-link for {user.email}: {reset_link}")
        return redirect(url_for("login"))
    return render_template("forgot_password.html")

@app.route("/reset/<token>", methods=["GET", "POST"])
def reset_with_token(token):
    user_id = verify_reset_token(token)
    if not user_id:
        flash("Ugyldig eller utløpt token.", "error")
        return redirect(url_for("forgot_password"))
    user = Bruker.query.get_or_404(user_id)
    if request.method == "POST":
        new_pw = request.form.get("password", "")
        confirm_pw = request.form.get("confirm_password", "")
        if not new_pw or new_pw != confirm_pw:
            flash("Passordene må være like og ikke tomme.", "error")
            return render_template("reset_password.html", token=token)
        user.password_hash = bcrypt.generate_password_hash(new_pw).decode("utf-8")
        db.session.commit()
        flash("Passord oppdatert! Du kan nå logge inn.", "success")
        return redirect(url_for("login"))
    return render_template("reset_password.html", token=token)

# -------------------------------
# RUN LOCAL
# -------------------------------
if __name__ == "__main__":
    app.run(debug=True)
