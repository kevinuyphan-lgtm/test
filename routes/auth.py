from flask import Blueprint, render_template, request, redirect, url_for, flash, session
from system.models import Bruker
from system.extensions import db, bcrypt
from system.utils.mailer import generate_reset_token, verify_reset_token, send_email

auth_bp = Blueprint("auth", __name__)

# -------------------------------
# AUTH ROUTES
# -------------------------------

@auth_bp.route("/")
def index():
    return render_template("index.html")

@auth_bp.route("/register", methods=["GET", "POST"])
def register():
    if request.method == "POST":
        name = request.form.get("name")
        email = request.form.get("email")
        password = request.form.get("password")
        confirm_password = request.form.get("confirm_password")

        if password != confirm_password:
            flash("Passordene samsvarer ikke!", "error")
            return redirect(url_for("auth.register"))

        if Bruker.query.filter_by(email=email).first():
            flash("Epost allerede registrert!", "error")
            return redirect(url_for("auth.register"))

        password_hash = bcrypt.generate_password_hash(password).decode("utf-8")
        ny_bruker = Bruker(navn=name, email=email, password_hash=password_hash)
        db.session.add(ny_bruker)
        db.session.commit()

        flash("Registrering vellykket! Du kan nå logge inn ✅", "success")
        return redirect(url_for("auth.login"))

    return render_template("register.html")

@auth_bp.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        email = request.form.get("email")
        password = request.form.get("password")
        user = Bruker.query.filter_by(email=email).first()
        if user and bcrypt.check_password_hash(user.password_hash, password):
            session['user'] = user.navn
            session['user_id'] = user.id
            flash("Velkommen tilbake!", "success")
            return redirect(url_for("faktura.tjenester"))
        flash("Feil epost eller passord", "error")
        return redirect(url_for("auth.login"))
    return render_template("login.html")

@auth_bp.route("/logout")
def logout():
    session.clear()
    flash("Du er nå logget ut 👋", "info")
    return redirect(url_for("auth.login"))

# -------------------------------
# PASSWORD RESET
# -------------------------------
@auth_bp.route("/forgot-password", methods=["GET", "POST"])
def forgot_password():
    if request.method == "POST":
        email = request.form.get("email", "").strip().lower()
        user = Bruker.query.filter_by(email=email).first()
        flash("Hvis e-posten finnes, har vi sendt en reset-link.", "info")
        if user:
            token = generate_reset_token(user.email)
            reset_link = url_for("auth.reset_with_token", token=token, _external=True)
            html = f"""
                <p>Hei {user.navn},</p>
                <p>Klikk lenken under for å tilbakestille passordet ditt:</p>
                <p><a href="{reset_link}">{reset_link}</a></p>
                <p>Lenken er gyldig i 1 time.</p>
            """
            send_email(subject="Tilbakestill passord", to_email=user.email, html_content=html)
        return redirect(url_for("auth.login"))
    return render_template("forgot_password.html")

@auth_bp.route("/reset/<token>", methods=["GET", "POST"])
def reset_with_token(token):
    email = verify_reset_token(token)
    if not email:
        flash("Ugyldig eller utløpt token.", "error")
        return redirect(url_for("auth.forgot_password"))
    user = Bruker.query.filter_by(email=email).first()
    if not user:
        flash("Bruker ikke funnet.", "error")
        return redirect(url_for("auth.forgot_password"))
    if request.method == "POST":
        pw = request.form.get("password")
        pw2 = request.form.get("confirm_password")
        if not pw or pw != pw2:
            flash("Passordene må være like.", "error")
            return render_template("reset_password.html", token=token)
        user.password_hash = bcrypt.generate_password_hash(pw).decode("utf-8")
        db.session.commit()
        flash("Passord oppdatert! Du kan nå logge inn.", "success")
        return redirect(url_for("auth.login"))
    return render_template("reset_password.html", token=token)
