from flask import Blueprint, request, jsonify, flash, redirect, url_for, render_template, session, send_file, send_from_directory
from system.models import Faktura, Bruker, Kunde
from system.extensions import db
from generate_pdf import generate_invoice_pdf
from system.utils.mailer import send_email
from datetime import datetime, timedelta
import os
from system.config import Config

faktura_bp = Blueprint("faktura", __name__)

def current_user():
    uid = session.get("user_id")
    return Bruker.query.get(uid) if uid else None

# -------------------------------
# Generate invoice
# -------------------------------
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

# -------------------------------
# Lagret fakturaer
# -------------------------------
@faktura_bp.route("/lagret_fakturaer")
def lagret_fakturaer():
    user = current_user()
    if not user:
        flash("Du må logge inn for å se fakturaene dine", "error")
        return redirect(url_for("auth.login"))
    fakturaer = Faktura.query.filter_by(user_id=user.id, status="utkast").all()
    return render_template("lagret_fakturaer.html", fakturaer=fakturaer)

# -------------------------------
# Serve PDF
# -------------------------------
@faktura_bp.route("/faktura/<filename>")
def serve_faktura(filename):
    user = current_user()
    if not user:
        return redirect(url_for("auth.login"))
    user_folder = os.path.join(Config.PDF_FOLDER, f"user_{user.id}")
    return send_from_directory(user_folder, filename)

# -------------------------------
# Send faktura AJAX
# -------------------------------
@faktura_bp.route("/send-faktura-ajax", methods=["POST"])
def send_faktura_ajax():
    user = current_user()
    if not user:
        return jsonify({"success": False}), 401

    data = request.get_json()
    faktura_ids = data.get("faktura_ids", [])
    emails = data.get("emails", [])

    sent_files = []
    for fid in faktura_ids:
        f = Faktura.query.get(fid)
        if f and f.user_id == user.id:
            user_folder = os.path.join(Config.PDF_FOLDER, f"user_{user.id}")
            filepath = os.path.join(user_folder, f.filnavn)
            if os.path.exists(filepath):
                send_email(
                    subject=f"Faktura {f.filnavn}",
                    to_email=", ".join(emails),
                    html_content=f"<p>Hei! Her er faktura {f.filnavn}</p>",
                    attachments=[filepath]
                )
                f.status = "sendt"
                sent_files.append(f.filnavn)
    db.session.commit()
    return jsonify({"success": True, "sent": sent_files})

# -------------------------------
# Send-faktura (vanlig GET)
# -------------------------------
@faktura_bp.route("/send-faktura/<int:faktura_id>")
def send_faktura(faktura_id):
    user = current_user()
    if not user:
        return redirect(url_for("auth.login"))
    faktura = Faktura.query.get_or_404(faktura_id)
    if faktura.user_id != user.id:
        flash("Ingen tilgang!", "error")
        return redirect(url_for("faktura.lagret_fakturaer"))
    faktura.status = "sendt"
    db.session.commit()
    flash("Faktura markert som SENDT ✉️", "success")
    return redirect(url_for("faktura.sendte"))

# -------------------------------
# Download faktura by filename
# -------------------------------
@faktura_bp.route("/download/<filename>")
def download_faktura(filename):
    user = current_user()
    if not user:
        return redirect(url_for("auth.login"))
    user_folder = os.path.join(Config.PDF_FOLDER, f"user_{user.id}")
    return send_from_directory(user_folder, filename, as_attachment=True)

# -------------------------------
# Download faktura by ID
# -------------------------------
@faktura_bp.route("/download-id/<int:faktura_id>")
def download_faktura_by_id(faktura_id):
    faktura = Faktura.query.get_or_404(faktura_id)
    user = current_user()
    if not user or faktura.user_id != user.id:
        flash("Du har ikke tilgang til denne filen", "error")
        return redirect(url_for("faktura.tjenester"))
    user_folder = os.path.join(Config.PDF_FOLDER, f"user_{user.id}")
    return send_from_directory(user_folder, faktura.filnavn, as_attachment=True)

# -------------------------------
# Sendte fakturaer
# -------------------------------
@faktura_bp.route("/sendte")
def sendte():
    user = current_user()
    if not user:
        flash("Du må logge inn for å se sendte fakturaer", "error")
        return redirect(url_for("auth.login"))
    fakturaer = Faktura.query.filter_by(user_id=user.id, status="sendt").all()
    return render_template("sendte.html", fakturaer=fakturaer)

# -------------------------------
# Mark faktura betalt
# -------------------------------
@faktura_bp.route("/mark-betalt/<int:faktura_id>")
def mark_betalt(faktura_id):
    user = current_user()
    if not user:
        return redirect(url_for("auth.login"))
    faktura = Faktura.query.get_or_404(faktura_id)
    if faktura.user_id != user.id:
        flash("Ingen tilgang!", "error")
        return redirect(url_for("faktura.sendte"))
    faktura.status = "betalt"
    faktura.betalt_dato = datetime.utcnow()
    db.session.commit()
    flash("Faktura markert som BETALT ✅", "success")
    return redirect(url_for("faktura.sendte"))

# -------------------------------
# Betalte fakturaer
# -------------------------------
@faktura_bp.route("/betalt")
def betalt():
    user = current_user()
    if not user:
        flash("Du må logge inn for å se betalte fakturaer", "error")
        return redirect(url_for("auth.login"))
    fakturaer = Faktura.query.filter_by(user_id=user.id, status="betalt").all()
    return render_template("betalt.html", fakturaer=fakturaer)
