from flask import Blueprint, request, render_template, flash, redirect, url_for, session
from system.models import Bruker
from system.extensions import db, bcrypt
from mail.utils import generate_reset_token, verify_reset_token
from mail.mailer import send_email

password_bp = Blueprint("password", __name__)

def current_user():
    uid = session.get("user_id")
    return Bruker.query.get(uid) if uid else None

# -------------------------------
# Forgot password
# -------------------------------
@password_bp.route("/forgot-password", methods=["GET", "POST"])
def forgot_password():
    if request.method == "POST":
        email = request.form.get("email", "").strip().lower()
        user = Bruker.query.filter_by(email=email).first()

        flash("Hvis e-posten finnes, har vi sendt en reset-link.", "info")

        if user:
            token = generate_reset_token(user.email)
            reset_link = url_for("password.reset_with_token", token=token, _external=True)
            html = f"""
                <p>Hei {user.navn},</p>
                <p>Klikk lenken under for å tilbakestille passordet ditt:</p>
                <p><a href="{reset_link}">{reset_link}</a></p>
                <p>Lenken er gyldig i 1 time.</p>
            """
            send_email(
                subject="Tilbakestill passord",
                to_email=user.email,
                html_content=html
            )

        return redirect(url_for("auth.login"))

    return render_template("forgot_password.html")

# -------------------------------
# Reset password with token
# -------------------------------
@password_bp.route("/reset/<token>", methods=["GET", "POST"])
def reset_with_token(token):
    email = verify_reset_token(token)
    if not email:
        flash("Ugyldig eller utløpt token.", "error")
        return redirect(url_for("password.forgot_password"))

    user = Bruker.query.filter_by(email=email).first()
    if not user:
        flash("Bruker ikke funnet.", "error")
        return redirect(url_for("password.forgot_password"))

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
