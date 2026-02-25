from flask import (
    Blueprint,
    request,
    jsonify,
    flash,
    redirect,
    url_for,
    render_template,
    session,
    send_file,
    send_from_directory,
)

from system.models import Faktura, Bruker, Sender
from system.extensions import db
from generate_pdf import generate_invoice_pdf
from system.utils.mailer import send_email
from datetime import datetime, timedelta
import os
from system.config import Config


faktura_bp = Blueprint("faktura", __name__)


# ---------------------------------------------------
# HELPER
# ---------------------------------------------------
def current_user():
    uid = session.get("user_id")
    return Bruker.query.get(uid) if uid else None


# ---------------------------------------------------
# FIRMA INNSTILLINGER
# ---------------------------------------------------
@faktura_bp.route("/firma-innstillinger", methods=["GET", "POST"])
def firma_innstillinger():
    user = current_user()
    if not user:
        return redirect(url_for("auth.login"))

    sender = Sender.query.filter_by(user_id=user.id).first()

    if request.method == "POST":

        if not sender:
            sender = Sender(user_id=user.id)
            db.session.add(sender)

        sender.firmanavn = request.form.get("firmanavn")
        sender.orgnr = request.form.get("orgnr")
        sender.adresse = request.form.get("adresse")
        sender.bank = request.form.get("bank")
        sender.telefon = request.form.get("telefon")
        sender.iban = request.form.get("iban")
        sender.swift = request.form.get("swift")
        sender.referanse = request.form.get("referanse")
        sender.kid = request.form.get("kid")

        db.session.commit()

        flash("Firmaopplysninger lagret ✅", "success")
        return redirect(url_for("faktura.firma_innstillinger"))

    return render_template("settings/firma_innstillinger.html", sender=sender)


# ---------------------------------------------------
# GENERER FAKTURA
# ---------------------------------------------------
@faktura_bp.route("/generate-invoice", methods=["POST"])
def generate_invoice():

    user = current_user()
    if not user:
        flash("Du må logge inn for å generere faktura", "error")
        return redirect(url_for("auth.login"))

    sender = Sender.query.filter_by(user_id=user.id).first()
    if not sender:
        flash("Du må sette opp firma-innstillinger først.", "error")
        return redirect(url_for("faktura.firma_innstillinger"))

    # -----------------------------------
    # TRYGG FAKTURANUMMER ØKNING
    # -----------------------------------
    user.faktura_teller += 1
    db.session.flush()
    fakturanummer = user.faktura_teller - 1

    # -----------------------------------
    # DATOER
    # -----------------------------------
    invoice_date_str = request.form.get("invoice_date")

    try:
        invoice_date = datetime.strptime(invoice_date_str, "%Y-%m-%d").date()
    except Exception:
        invoice_date = datetime.utcnow().date()

    try:
        days_to_due = max(int(request.form.get("forfalls_dager", 10)), 0)
    except Exception:
        days_to_due = 10

    due_date = invoice_date + timedelta(days=days_to_due)

    # -----------------------------------
    # PRODUKTER
    # -----------------------------------
    navn_liste = request.form.getlist("produkt_navn[]")
    antall_liste = request.form.getlist("produkt_antall[]")
    pris_liste = request.form.getlist("produkt_pris[]")
    mva_liste = request.form.getlist("produkt_mva[]")

    produkter = []

    for i in range(len(navn_liste)):
        navn = navn_liste[i].strip()

        if not navn:
            continue

        try:
            antall = max(int(antall_liste[i]), 1)
        except Exception:
            antall = 1

        try:
            pris = max(float(str(pris_liste[i]).replace(",", ".")), 0)
        except Exception:
            pris = 0

        mva = mva_liste[i] if mva_liste[i] in ["0", "12", "15", "25"] else "25"

        produkter.append({
            "navn": navn,
            "antall": antall,
            "pris": pris,
            "mva": mva
        })

    if not produkter:
        flash("Du må legge til minst ett produkt.", "error")
        return redirect(url_for("services.tjenester"))

    # -----------------------------------
    # FIRMA DATA
    # -----------------------------------
    vårt_firma = {
        "navn": sender.firmanavn,
        "orgnr": sender.orgnr,
        "addresse": sender.adresse,
        "navn_på_bank": sender.bank,
        "telefon": sender.telefon,
        "IBAN": sender.iban,
        "swift_bic": sender.swift,
        "vår_referanse": sender.referanse,
        "KID": sender.kid,
    }

    invoice_data = {
        "invoice_number": fakturanummer,
        "firmanavn": request.form.get("firmanavn"),
        "firmaadresse": request.form.get("firmaadresse"),
        "orgnr": request.form.get("orgnr"),
        "referanse": request.form.get("referanse"),
        "invoice_date": invoice_date.strftime("%d.%m.%Y"),
        "due_date": due_date.strftime("%d.%m.%Y"),
        "produkter": produkter,
        "vårt_firma": vårt_firma,
    }

    # -----------------------------------
    # GENERER PDF
    # -----------------------------------
    pdf_buffer = generate_invoice_pdf(invoice_data)

    user_folder = os.path.join(Config.PDF_FOLDER, f"user_{user.id}")
    os.makedirs(user_folder, exist_ok=True)

    filename = f"faktura_{fakturanummer}.pdf"
    filepath = os.path.join(user_folder, filename)

    with open(filepath, "wb") as f:
        f.write(pdf_buffer.getbuffer())

    faktura = Faktura(
        filnavn=filename,
        user_id=user.id,
        status="utkast",
    )

    db.session.add(faktura)
    db.session.commit()

    pdf_buffer.seek(0)
    return send_file(pdf_buffer, as_attachment=True, download_name=filename)


# ---------------------------------------------------
# GENERISK ARKIV
# ---------------------------------------------------
@faktura_bp.route("/arkiv/<status>")
def faktura_arkiv(status):

    user = current_user()
    if not user:
        return redirect(url_for("auth.login"))

    allowed_statuses = ["utkast", "sendt", "betalt"]

    if status not in allowed_statuses:
        return redirect(url_for("faktura.faktura_arkiv", status="utkast"))

    page = request.args.get("page", 1, type=int)
    search = request.args.get("search", "")
    sort = request.args.get("sort", "dato_desc")
    per_page = request.args.get("per_page", 15, type=int)

    if per_page not in [10, 15, 25, 50]:
        per_page = 15

    query = Faktura.query.filter_by(
        user_id=user.id,
        status=status
    )

    if search:
        query = query.filter(Faktura.filnavn.ilike(f"%{search}%"))

    if sort == "dato_asc":
        query = query.order_by(Faktura.dato.asc())
    elif sort == "navn_asc":
        query = query.order_by(Faktura.filnavn.asc())
    elif sort == "navn_desc":
        query = query.order_by(Faktura.filnavn.desc())
    else:
        query = query.order_by(Faktura.dato.desc())

    pagination = query.paginate(
        page=page,
        per_page=per_page,
        error_out=False
    )

    return render_template(
        "faktura_tjeneste/lagret_fakturaer.html",
        fakturaer=pagination.items,
        pagination=pagination,
        search=search,
        sort=sort,
        per_page=per_page,
        current_status=status
    )


# ---------------------------------------------------
# DOWNLOAD
# ---------------------------------------------------
@faktura_bp.route("/download/<int:faktura_id>")
def download_faktura(faktura_id):

    user = current_user()
    if not user:
        return redirect(url_for("auth.login"))

    faktura = Faktura.query.filter_by(
        id=faktura_id,
        user_id=user.id
    ).first_or_404()

    user_folder = os.path.join(Config.PDF_FOLDER, f"user_{user.id}")

    return send_from_directory(
        user_folder,
        faktura.filnavn,
        as_attachment=True
    )


# ---------------------------------------------------
# SEND VIA EMAIL (AJAX)
# ---------------------------------------------------
@faktura_bp.route("/send-ajax", methods=["POST"])
def send_faktura_ajax():

    user = current_user()
    if not user:
        return jsonify({"success": False}), 401

    data = request.get_json() or {}
    faktura_ids = data.get("faktura_ids", [])
    emails = data.get("emails", [])

    if not faktura_ids or not emails:
        return jsonify({"success": False}), 400

    fakturaer = Faktura.query.filter(
        Faktura.id.in_(faktura_ids),
        Faktura.user_id == user.id
    ).all()

    user_folder = os.path.join(Config.PDF_FOLDER, f"user_{user.id}")
    sent_files = []

    for f in fakturaer:
        filepath = os.path.join(user_folder, f.filnavn)

        if not os.path.exists(filepath):
            continue

        send_email(
            subject=f"Faktura {f.filnavn}",
            to_email=", ".join(emails),
            html_content=f"<p>Hei! Her er faktura {f.filnavn}</p>",
            attachments=[filepath],
        )

        f.status = "sendt"
        sent_files.append(f.filnavn)

    db.session.commit()

    return jsonify({
        "success": True,
        "sent": sent_files
    })
