from flask import Blueprint, request, jsonify, flash, redirect, url_for, render_template, session
from system.models import Kunde, Bruker
from system.extensions import db

kunde_bp = Blueprint("kunde", __name__)

def current_user():
    uid = session.get("user_id")
    return Bruker.query.get(uid) if uid else None

# -------------------------------
# KUNDE ROUTES
# -------------------------------
@kunde_bp.route("/kundeliste")
def kundeliste():
    user = current_user()
    if not user:
        flash("Du må være logget inn for å se kundelisten.", "error")
        return redirect(url_for("auth.login"))
    kunder = Kunde.query.filter_by(user_id=user.id).all()
    return render_template("kundeliste.html", kunder=kunder)

@kunde_bp.route("/update-kunde/<int:kunde_id>", methods=["POST"])
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
        return jsonify({"success": True, "kunde": {
            "id": kunde.id, "navn": kunde.navn, "firma": kunde.firmanavn,
            "adresse": kunde.adresse, "orgnr": kunde.orgnr, "referanse": kunde.referanse,
            "telefon": kunde.telefon, "epost": kunde.epost
        }})
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": str(e)}), 500

@kunde_bp.route("/add-kunde", methods=["POST"])
def add_kunde():
    user = current_user()
    if not user:
        return jsonify({"success": False, "message": "Du må være logget inn"}), 401
    data = request.get_json()
    try:
        ny_kunde = Kunde(
            navn=data.get("navn", ""), firmanavn=data.get("firma", ""),
            adresse=data.get("adresse", ""), orgnr=data.get("orgnr", ""),
            referanse=data.get("referanse", ""), telefon=data.get("telefon", ""),
            epost=data.get("epost", ""), user_id=user.id
        )
        db.session.add(ny_kunde)
        db.session.commit()
        return jsonify({"success": True, "kunde": {
            "id": ny_kunde.id, "navn": ny_kunde.navn, "firma": ny_kunde.firmanavn,
            "adresse": ny_kunde.adresse, "orgnr": ny_kunde.orgnr, "referanse": ny_kunde.referanse,
            "telefon": ny_kunde.telefon, "epost": ny_kunde.epost
        }})
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": str(e)}), 500

@kunde_bp.route("/delete-kunde/<int:kunde_id>", methods=["POST"])
def delete_kunde(kunde_id):
    try:
        kunde = Kunde.query.get(kunde_id)
        if not kunde:
            return jsonify({"success": False, "message": "Kunde ikke funnet."}), 404
        db.session.delete(kunde)
        db.session.commit()
        return jsonify({"success": True, "message": "Kunde slettet."})
    except Exception as e:
        return jsonify({"success": False, "message": "En feil oppstod under sletting."}), 500

