from flask import Blueprint, request, jsonify, flash, redirect, url_for, render_template, session, send_file, send_from_directory
from system.models import Faktura, Bruker, Kunde
from system.extensions import db
from utils.pdf import generate_invoice_pdf
from utils.mailer import send_email
from datetime import datetime, timedelta
import os
from system.config import Config

faktura_bp = Blueprint("faktura", __name__)

def current_user():
    uid = session.get("user_id")
    return Bruker.query.get(uid) if uid else None

# -------------------------------
# ROUTES
# -------------------------------

@faktura_bp.route("/tjenester")
def tjenester():
    user = current_user()
    if not user:
        flash("Du må logge inn for å få tilgang til tjenester", "error")
        return redirect(url_for("auth.login"))
    kunder = Kunde.query.filter_by(user_id=user.id).all()
    return render_template("tjenester.html", kunder=kunder)

@faktura_bp.route("/generate-invoice", methods=["POST"])
def generate_invoice():
    user = current_user()
    if not user:
        flash("Du må logge inn for å generere faktura", "error")
        return redirect(url_for("auth.login"))

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

    user_folder = os.path.join(Config.PDF_FOLDER, f"user_{user.id}")
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

# Her kan du legge til sendte, mark betalt, lagret fakturaer, download osv.

