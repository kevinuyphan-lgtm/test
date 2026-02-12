from flask import Blueprint, render_template, flash, redirect, url_for, session, request, jsonify
from system.extensions import db
from system.models import Kunde, Bruker, Sender

services_bp = Blueprint("services", __name__)


# -------------------------------
# Hent innlogget bruker
# -------------------------------
def current_user():
    uid = session.get("user_id")
    return Bruker.query.get(uid) if uid else None


# -------------------------------
# Static / service pages
# -------------------------------
@services_bp.route("/om-oss")
def om_oss():
    return render_template("om-oss.html")


@services_bp.route("/kontakt")
def kontakt():
    return render_template("kontakt.html")


@services_bp.route("/tjenester")
def tjenester():
    user = current_user()
    if not user:
        return redirect(url_for("auth.login"))

    # Hent sender riktig (relationship returnerer liste)
    sender = user.sender
    
    return render_template(
        "faktura_tjeneste/tjeneste.html",
        kunder=user.kunder,
        sender=sender
    )

# -------------------------------
# HENT AVSENDER
# -------------------------------
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
        "adresse": sender.adresse
    })


# -------------------------------
# LAGRE AVSENDER
# -------------------------------
@services_bp.route("/save-sender", methods=["POST"])
def save_sender():
    user = current_user()
    if not user:
        return jsonify({"success": False})

    data = request.get_json()

    sender = Sender.query.filter_by(user_id=user.id).first()

    if not sender:
        sender = Sender(user_id=user.id)
        db.session.add(sender)

    sender.firmanavn = data.get("firmanavn")
    sender.orgnr = data.get("orgnr")
    sender.adresse = data.get("adresse")

    db.session.commit()

    return jsonify({"success": True})
