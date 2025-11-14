from flask import Flask, render_template, request, redirect, url_for, flash, session, send_from_directory, send_file, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from flask_migrate import Migrate
from itsdangerous import URLSafeTimedSerializer, BadSignature, SignatureExpired
from datetime import datetime, timedelta
import os
from generate_pdf import generate_invoice_pdf

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

# -------------------------------
# DATABASE CONFIG
# -------------------------------
db_url = os.environ.get("DATABASE_URL")
if db_url:
    db_url = db_url.replace("postgres://", "postgresql://", 1)
else:
    db_url = f"sqlite:///{os.path.join(INSTANCE_PATH, 'fakturaer.db')}"

app.config['SQLALCHEMY_DATABASE_URI'] = db_url
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# -------------------------------
# EXTENSIONS
# -------------------------------
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
    __tablename__ = 'kunde'
    id = db.Column(db.Integer, primary_key=True)
    navn = db.Column(db.String(150), nullable=False)
    epost = db.Column(db.String(150))
    telefon = db.Column(db.String(50))
    adresse = db.Column(db.String(200))
    orgnr = db.Column(db.String(50))
    referanse = db.Column(db.String(100))
    user_id = db.Column(db.Integer, db.ForeignKey('bruker.id'), nullable=False)
    firmanavn = db.Column(db.String(150))
    land = db.Column(db.String(50))
    test = db.Column(db.String(100))  # <- ny kolonne
    test2 = db.Column(db.String(100))  # <- ny kolonne

class Faktura(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    filnavn = db.Column(db.String(100), nullable=False)
    dato = db.Column(db.DateTime, default=datetime.utcnow)
    status = db.Column(db.String(20), default="utkast")
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

    invoice_date_str = request.form.get("invoice_date")
    invoice_date = datetime.strptime(invoice_date_str, "%Y-%m-%d").date() if invoice_date_str else datetime.utcnow().date()
    days_to_due = request.form.get("forfalls_dager")
    due_date = invoice_date + timedelta(days=int(days_to_due)) if days_to_due and days_to_due.isdigit() else invoice_date + timedelta(days=10)

    invoice_data = {
        "invoice_number": fakturanummer,
        "firmanavn": request.form.get("firmanavn"),
        "firmaadresse": request.form.get("firmaadresse"),
        "orgnr": request.form.get("orgnr"),
        "referanse": request.form.get("referanse"),
        "invoice_date": invoice_date.strftime("%Y-%m-%d"),
        "due_date": due_date.strftime("%Y-%m-%d"),
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

    faktura = Faktura(filnavn=filename, user_id=user.id, status="utkast")
    db.session.add(faktura)
    db.session.commit()

    pdf_buffer.seek(0)
    return send_file(pdf_buffer, as_attachment=True, download_name=filename)

# -------------------------------
# Resterende ruter
# -------------------------------
@app.route("/lagret_fakturaer")
def lagret_fakturaer():
    user = current_user()
    if not user:
        flash("Du må logge inn for å se fakturaene dine", "error")
        return redirect(url_for("login"))
    fakturaer = Faktura.query.filter_by(user_id=user.id, status="utkast").all()
    return render_template("lagret_fakturaer.html", fakturaer=fakturaer)

@app.route("/sendte")
def sendte():
    user = current_user()
    if not user:
        flash("Du må logge inn for å se sendte fakturaer", "error")
        return redirect(url_for("login"))
    fakturaer = Faktura.query.filter_by(user_id=user.id, status="sendt").all()
    return render_template("sendte.html", fakturaer=fakturaer)

@app.route("/send-faktura/<int:faktura_id>")
def send_faktura(faktura_id):
    user = current_user()
    if not user:
        return redirect(url_for("login"))
    faktura = Faktura.query.get_or_404(faktura_id)
    if faktura.user_id != user.id:
        flash("Ingen tilgang!", "error")
        return redirect(url_for("lagret_fakturaer"))
    faktura.status = "sendt"
    db.session.commit()
    flash("Faktura markert som SENDT ✉️", "success")
    return redirect(url_for("sendte"))

@app.route("/mark-betalt/<int:faktura_id>")
def mark_betalt(faktura_id):
    user = current_user()
    if not user:
        return redirect(url_for("login"))
    faktura = Faktura.query.get_or_404(faktura_id)
    if faktura.user_id != user.id:
        flash("Ingen tilgang!", "error")
        return redirect(url_for("sendte"))
    faktura.status = "betalt"
    faktura.betalt_dato = datetime.utcnow()
    db.session.commit()
    flash("Faktura markert som BETALT ✅", "success")
    return redirect(url_for("sendte"))

@app.route("/kundeliste")
def kundeliste():
    user = current_user()
    if not user:
        flash("Du må være logget inn for å se kundelisten.", "error")
        return redirect(url_for("login"))
    kunder = Kunde.query.filter_by(user_id=user.id).all()
    return render_template("kundeliste.html", kunder=kunder)

@app.route("/betalt")
def betalt():
    user = current_user()
    if not user:
        flash("Du må logge inn for å se betalte fakturaer", "error")
        return redirect(url_for("login"))
    fakturaer = Faktura.query.filter_by(user_id=user.id, status="betalt").all()
    return render_template("betalt.html", fakturaer=fakturaer)

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
# AJAX-RUTER FOR KUNDER
# -------------------------------
@app.route("/update-kunde/<int:kunde_id>", methods=["POST"], endpoint="update_kunde")
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

@app.route("/add-kunde", methods=["POST"], endpoint="add_kunde")
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

@app.route("/delete-kunde/<int:kunde_id>", methods=["POST"])
def delete_kunde(kunde_id):
    try:
        kunde = Kunde.query.get(kunde_id)
        if not kunde:
            return jsonify({"success": False, "message": "Kunde ikke funnet."}), 404
        db.session.delete(kunde)
        db.session.commit()
        return jsonify({"success": True, "message": "Kunde slettet."})
    except Exception as e:
        print("Feil under sletting:", e)
        return jsonify({"success": False, "message": "En feil oppstod under sletting."}), 500

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
# KJØR APP LOKALT
# -------------------------------
if __name__ == "__main__":
    app.run(debug=True)
