from flask import Blueprint, render_template, redirect, url_for, session, request, jsonify
from system.extensions import db
from system.models import Kunde, Bruker, Sender

services_bp = Blueprint("services", __name__)


# ---------------------------------------------------
# HENT INNLOGGET BRUKER
# ---------------------------------------------------
def current_user():
    uid = session.get("user_id")
    return Bruker.query.get(uid) if uid else None


# ---------------------------------------------------
# STATIC SIDENE (IKKE RØRT)
# ---------------------------------------------------
@services_bp.route("/om-oss")
def om_oss():
    return render_template("om-oss.html")


@services_bp.route("/kontakt")
def kontakt():
    return render_template("kontakt.html")


# ---------------------------------------------------
# TJENESTER (NY FAKTURA SIDE)
# ---------------------------------------------------
@services_bp.route("/tjenester")
def tjenester():
    user = current_user()
    if not user:
        return redirect(url_for("auth.login"))

    # 🔥 HENT SENDER DIREKTE FRA DB (STABIL LØSNING)
    sender = Sender.query.filter_by(user_id=user.id).first()

    return render_template(
        "faktura_tjeneste/tjenester.html",
        kunder=user.kunder,
        sender=sender
    )


# ---------------------------------------------------
# HENT AVSENDER (AJAX)
# ---------------------------------------------------
@services_bp.route("/get-sender", methods=["GET"])
def get_sender():
    user = current_user()
    if not user:
        return jsonify({"exists": False})

    sender = Sender.query.filter_by(user_id=user.id).first()

    if not sender:
        return jsonify({"exists": False})

    return jsonify({
        "exists": True,
        "firmanavn": sender.firmanavn,
        "orgnr": sender.orgnr,
        "adresse": sender.adresse,
        "bank": sender.bank,
        "telefon": sender.telefon,
        "iban": sender.iban,
        "swift": sender.swift,
        "referanse": sender.referanse,
        "kid": sender.kid
    })


# ---------------------------------------------------
# LAGRE AVSENDER (AJAX)
# ---------------------------------------------------
@services_bp.route("/save-sender", methods=["POST"])
def save_sender():
    user = current_user()
    if not user:
        return jsonify({"success": False}), 401

    data = request.get_json()

    sender = Sender.query.filter_by(user_id=user.id).first()

    if not sender:
        sender = Sender(user_id=user.id)
        db.session.add(sender)

    sender.firmanavn = data.get("firmanavn")
    sender.orgnr = data.get("orgnr")
    sender.adresse = data.get("adresse")
    sender.bank = data.get("bank")
    sender.telefon = data.get("telefon")
    sender.iban = data.get("iban")
    sender.swift = data.get("swift")
    sender.referanse = data.get("referanse")
    sender.kid = data.get("kid")

    db.session.commit()

    return jsonify({"success": True})
