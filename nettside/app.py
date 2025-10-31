from flask import Flask, render_template, request, redirect, url_for, flash, session, send_from_directory, abort
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
# APP CONFIG
# -------------------------------
app = Flask(__name__, instance_path=INSTANCE_PATH)
app.secret_key = "super_secret_key"  # Må settes før serializer

# Admin
ADMIN_EMAILS = {"kevinuyphan3@gmail.com"}

# Database
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(INSTANCE_PATH, 'fakturaer.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Init DB og Bcrypt
db = SQLAlchemy(app)
bcrypt = Bcrypt(app)

# Token serializer
serializer = URLSafeTimedSerializer(app.secret_key)

# -------------------------------
# MODELS
# -------------------------------
class Bruker(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    navn = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password_hash = db.Column(db.String(200), nullable=False)
    fakturaer = db.relationship('Faktura', backref='bruker', lazy=True)

class Faktura(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    filnavn = db.Column(db.String(100), nullable=False)
    dato = db.Column(db.DateTime, default=datetime.utcnow)
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
# CREATE DB
# -------------------------------
with app.app_context():
    db.create_all()

# -------------------------------
# ROUTES: AUTH
# -------------------------------
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
# ROUTES: ADMIN
# -------------------------------
@app.route("/admin")
def admin():
    if not current_user():
        flash("Du må logge inn", "error")
        return redirect(url_for("login"))
    if not is_admin():
        flash("Du har ikke tilgang til admin-siden", "error")
        return redirect(url_for("tjenester"))

    alle_brukere = Bruker.query.all()
    return render_template("admin.html", brukere=alle_brukere)

@app.route("/admin/users", methods=["GET"])
def admin_users():
    if not is_admin():
        flash("Du har ikke tilgang til admin-sider.", "error")
        return redirect(url_for("index"))
    users = Bruker.query.all()
    return render_template("admin_users.html", users=users)

@app.route("/admin/verify", methods=["POST"])
def admin_verify():
    if not is_admin():
        flash("Du har ikke tilgang til admin-sider.", "error")
        return redirect(url_for("index"))
    user_id = request.form.get("user_id")
    plain = request.form.get("password_to_test", "")
    if not user_id:
        flash("Velg en bruker.", "error")
        return redirect(url_for("admin_users"))
    user = Bruker.query.get(user_id)
    if not user:
        flash("Bruker ikke funnet.", "error")
        return redirect(url_for("admin_users"))

    matches = bcrypt.check_password_hash(user.password_hash, plain)
    users = Bruker.query.all()
    return render_template(
        "admin_users.html",
        users=users,
        test_result={
            "email": user.email,
            "matches": matches,
            "tested_password": plain
        }
    )

# -------------------------------
# ROUTES: SERVICES & INVOICES
# -------------------------------
@app.route("/om-oss")
def om_oss():
    return render_template("om-oss.html")

@app.route("/kontakt")
def kontakt():
    return render_template("kontakt.html")


@app.route("/tjenester")
def tjenester():
    if not current_user():
        flash("Du må logge inn for å få tilgang til tjenester", "error")
        return redirect(url_for("login"))
    return render_template("tjenester.html")

@app.route("/fakturaer")
def fakturaer():
    if not current_user():
        flash("Du må logge inn for å se fakturaene dine", "error")
        return redirect(url_for("login"))
    bruker_fakturaer = Faktura.query.filter_by(user_id=session["user_id"]).all()
    return render_template("fakturaer.html", fakturaer=bruker_fakturaer)

@app.route("/mine-filer")
def mine_filer():
    if not current_user():
        return redirect(url_for("login"))
    fakturaer = Faktura.query.filter_by(user_id=session["user_id"]).all()
    return render_template("mine_filer.html", fakturaer=fakturaer)

@app.route("/download/<int:faktura_id>")
def download_faktura(faktura_id):
    faktura = Faktura.query.get_or_404(faktura_id)
    if faktura.user_id != session.get("user_id"):
        flash("Du har ikke tilgang til denne filen", "error")
        return redirect(url_for("mine_filer"))
    user_folder = os.path.join(PDF_FOLDER, f"user_{session['user_id']}")
    return send_from_directory(user_folder, faktura.filnavn, as_attachment=True)

@app.route("/generate-invoice", methods=["POST"])
def generate_invoice():
    if not current_user():
        flash("Du må logge inn for å generere faktura", "error")
        return redirect(url_for("login"))
    invoice_data = {
        "firmanavn": request.form.get("firmanavn"),
        "firmaadresse": request.form.get("firmaadresse"),
        "orgnr": request.form.get("orgnr"),
        "referanse": request.form.get("referanse"),
        "invoice_date": request.form.get("invoice_date"),
        "due_date": request.form.get("due_date"),
    }
    produkt_navn = request.form.getlist("produkt_navn[]")
    produkt_antall = request.form.getlist("produkt_antall[]")
    produkt_pris = request.form.getlist("produkt_pris[]")
    produkter = [{"navn": produkt_navn[i], "antall": produkt_antall[i], "pris": produkt_pris[i]} for i in range(len(produkt_navn))]
    invoice_data["produkter"] = produkter

    faktura_nummer_fil = os.path.join(BASE_DIR, "faktura_nummer.txt")
    if not os.path.exists(faktura_nummer_fil):
        fakturanummer = 1001
    else:
        with open(faktura_nummer_fil, "r") as f:
            fakturanummer = int(f.read().strip()) + 1
    with open(faktura_nummer_fil, "w") as f:
        f.write(str(fakturanummer))

    invoice_data["invoice_number"] = fakturanummer

    user_folder = os.path.join(PDF_FOLDER, f"user_{session['user_id']}")
    os.makedirs(user_folder, exist_ok=True)
    filename = f"faktura_{fakturanummer}.pdf"
    filepath = os.path.join(user_folder, filename)
    pdf_buffer = generate_invoice_pdf(invoice_data)
    with open(filepath, "wb") as f:
        f.write(pdf_buffer.getbuffer())

    faktura = Faktura(filnavn=filename, user_id=session["user_id"])
    db.session.add(faktura)
    db.session.commit()
    flash("Faktura generert og lagret!", "success")
    return redirect(url_for("tjenester"))

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
# ROOT
# -------------------------------
@app.route("/")
def index():
    return render_template("index.html")

# -------------------------------
# RUN APP
# -------------------------------
if __name__ == "__main__":
    app.run(debug=True)
