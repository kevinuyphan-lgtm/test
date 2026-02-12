from flask import Blueprint, request, jsonify, flash, redirect, url_for, render_template, session, send_file, send_from_directory
from system.models import Faktura, Bruker
from system.extensions import db
from generate_pdf import generate_invoice_pdf
from system.utils.mailer import send_email
from datetime import datetime, timedelta
import os
from system.config import Config

faktura_bp = Blueprint("faktura", __name__)

# -------------------------------
# Helpers
# -------------------------------
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

    from tjenester import STANDARD_VAART_FIRMA

    # Fakturanummer
    fakturanummer = user.faktura_teller
    user.faktura_teller += 1
    db.session.commit()

    # Datoer
    invoice_date_str = request.form.get("invoice_date")
    invoice_date = (
        datetime.strptime(invoice_date_str, "%Y-%m-%d").date()
        if invoice_date_str
        else datetime.utcnow().date()
    )

    days_to_due = request.form.get("forfalls_dager")
    due_date = (
        invoice_date + timedelta(days=int(days_to_due))
        if days_to_due and days_to_due.isdigit()
        else invoice_date + timedelta(days=10)
    )

    # Produkter
    produkter = [
        {"navn": n, "antall": a, "pris": p}
        for n, a, p in zip(
            request.form.getlist("produkt_navn[]"),
            request.form.getlist("produkt_antall[]"),
            request.form.getlist("produkt_pris[]"),
        )
    ]

    # Vårt firma (merge standard + skjema)
    vårt_firma = STANDARD_VAART_FIRMA.copy()

    vårt_firma.update({
        "navn": request.form.get("avsender_firmanavn") or vårt_firma["navn"],
        "orgnr": request.form.get("avsender_orgnr") or vårt_firma["orgnr"],
        "addresse": request.form.get("avsender_adresse") or vårt_firma["addresse"],
        "navn_på_bank": request.form.get("avsender_bank") or vårt_firma["navn_på_bank"],
        "telefon": request.form.get("avsender_telefon") or vårt_firma["telefon"],
        "IBAN": request.form.get("avsender_iban") or vårt_firma["IBAN"],
        "swift_bic": request.form.get("avsender_swift") or vårt_firma["swift_bic"],
        "vår_referanse": request.form.get("avsender_referanse") or vårt_firma["vår_referanse"],
        "KID": request.form.get("avsender_kid") or vårt_firma["KID"],
    })

    # Samle invoice_data
    invoice_data = {
        "invoice_number": fakturanummer,
        "firmanavn": request.form.get("firmanavn"),
        "firmaadresse": request.form.get("firmaadresse"),
        "orgnr": request.form.get("orgnr"),
        "referanse": request.form.get("referanse"),
        "invoice_date": invoice_date.strftime("%Y-%m-%d"),
        "due_date": due_date.strftime("%Y-%m-%d"),
        "produkter": produkter,
        "vårt_firma": vårt_firma
    }

    # Lagre PDF
    user_folder = os.path.join(Config.PDF_FOLDER, f"user_{user.id}")
    os.makedirs(user_folder, exist_ok=True)

    filename = f"faktura_{fakturanummer}.pdf"
    filepath = os.path.join(user_folder, filename)

    pdf_buffer = generate_invoice_pdf(invoice_data)

    with open(filepath, "wb") as f:
        f.write(pdf_buffer.getbuffer())

    faktura = Faktura(
        filnavn=filename,
        user_id=user.id,
        status="utkast"
    )

    db.session.add(faktura)
    db.session.commit()

    pdf_buffer.seek(0)
    return send_file(pdf_buffer, as_attachment=True, download_name=filename)


# -------------------------------
# Lagret fakturaer
# -------------------------------
@faktura_bp.route("/lagret")
def lagret_fakturaer():
    user = current_user()
    if not user:
        flash("Du må logge inn", "error")
        return redirect(url_for("auth.login"))

    fakturaer = Faktura.query.filter_by(user_id=user.id, status="utkast").all()
    return render_template("faktura_tjeneste/lagret_fakturaer.html", fakturaer=fakturaer)


# -------------------------------
# Sendte fakturaer
# -------------------------------
@faktura_bp.route("/sendte")
def sendte():
    user = current_user()
    if not user:
        flash("Du må logge inn", "error")
        return redirect(url_for("auth.login"))

    fakturaer = Faktura.query.filter_by(user_id=user.id, status="sendt").all()
    return render_template("faktura_tjeneste/sendte.html", fakturaer=fakturaer)


# -------------------------------
# Betalte fakturaer
# -------------------------------
@faktura_bp.route("/betalt")
def betalt():
    user = current_user()
    if not user:
        flash("Du må logge inn", "error")
        return redirect(url_for("auth.login"))

    fakturaer = Faktura.query.filter_by(user_id=user.id, status="betalt").all()
    return render_template("faktura_tjeneste/betalt.html", fakturaer=fakturaer)


# -------------------------------
# Download
# -------------------------------
@faktura_bp.route("/download/<int:faktura_id>")
def download_faktura(faktura_id):
    user = current_user()
    if not user:
        return redirect(url_for("auth.login"))

    faktura = Faktura.query.get_or_404(faktura_id)

    if faktura.user_id != user.id:
        flash("Ingen tilgang", "error")
        return redirect(url_for("faktura.sendte"))

    user_folder = os.path.join(Config.PDF_FOLDER, f"user_{user.id}")
    return send_from_directory(user_folder, faktura.filnavn, as_attachment=True)


# -------------------------------
# Marker som sendt
# -------------------------------
@faktura_bp.route("/mark-send/<int:faktura_id>")
def mark_sendt(faktura_id):
    user = current_user()
    if not user:
        return redirect(url_for("auth.login"))

    faktura = Faktura.query.get_or_404(faktura_id)

    if faktura.user_id != user.id:
        flash("Ingen tilgang", "error")
        return redirect(url_for("faktura.lagret_fakturaer"))

    faktura.status = "sendt"
    db.session.commit()
    flash("Faktura markert som sendt ✅", "success")

    return redirect(url_for("faktura.sendte"))


# -------------------------------
# Marker som betalt
# -------------------------------
@faktura_bp.route("/mark-betalt/<int:faktura_id>")
def mark_betalt(faktura_id):
    user = current_user()
    if not user:
        return redirect(url_for("auth.login"))

    faktura = Faktura.query.get_or_404(faktura_id)

    if faktura.user_id != user.id:
        flash("Ingen tilgang", "error")
        return redirect(url_for("faktura.sendte"))

    faktura.status = "betalt"
    faktura.betalt_dato = datetime.utcnow()
    db.session.commit()

    flash("Faktura markert som betalt ✅", "success")
    return redirect(url_for("faktura.sendte"))


# -------------------------------
# Send faktura (AJAX)
# -------------------------------
@faktura_bp.route("/send-ajax", methods=["POST"])
def send_faktura_ajax():
    user = current_user()
    if not user:
        return jsonify({"success": False}), 401

    data = request.get_json() or {}
    faktura_ids = data.get("faktura_ids", [])
    emails = data.get("emails", [])

    sent_files = []

    for fid in faktura_ids:
        f = Faktura.query.get(fid)
        if not f or f.user_id != user.id:
            continue

        user_folder = os.path.join(Config.PDF_FOLDER, f"user_{user.id}")
        filepath = os.path.join(user_folder, f.filnavn)

        if os.path.exists(filepath):
            send_email(
                subject=f"Faktura {f.filnavn}",
                to_email=", ".join(emails),
                html_content=f"<p>Hei! Her er faktura {f.filnavn}</p>",
                attachments=[filepath],
            )
            f.status = "sendt"
            sent_files.append(f.filnavn)

    db.session.commit()
    return jsonify({"success": True, "sent": sent_files})
