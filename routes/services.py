from flask import Blueprint, render_template, flash, redirect, url_for, session
from system.models import Kunde

services_bp = Blueprint("services", __name__)

def current_user():
    uid = session.get("user_id")
    return Kunde.query.session.get(uid) if uid else None

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
    from system.models import Bruker
    uid = session.get("user_id")
    if not uid:
        flash("Du må logge inn for å få tilgang til tjenester", "error")
        return redirect(url_for("auth.login"))
    user = Bruker.query.get(uid)
    kunder = Kunde.query.filter_by(user_id=user.id).all()
    return render_template("faktura_tjeneste/tjenester.html", kunder=kunder)
