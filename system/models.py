from system.extensions import db
from datetime import datetime


class Bruker(db.Model):
    id = db.Column(db.Integer, primary_key=True)

    navn = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password_hash = db.Column(db.String(200), nullable=False)

    faktura_teller = db.Column(db.Integer, default=1000)

    fakturaer = db.relationship("Faktura", backref="bruker", lazy=True)
    kunder = db.relationship("Kunde", backref="bruker", lazy=True)


class Kunde(db.Model):
    id = db.Column(db.Integer, primary_key=True)

    navn = db.Column(db.String(150), nullable=False)
    epost = db.Column(db.String(150))
    telefon = db.Column(db.String(50))
    adresse = db.Column(db.String(200))
    orgnr = db.Column(db.String(50))
    referanse = db.Column(db.String(100))

    firmanavn = db.Column(db.String(150))
    land = db.Column(db.String(50))

    user_id = db.Column(db.Integer, db.ForeignKey("bruker.id"), nullable=False)

    fakturaer = db.relationship("Faktura", backref="kunde", lazy=True)


class Faktura(db.Model):
    id = db.Column(db.Integer, primary_key=True)

    # nummer
    faktura_nummer = db.Column(db.Integer, nullable=False)
    order_nummer = db.Column(db.String(50), nullable=False)

    # pdf fil
    filnavn = db.Column(db.String(100), nullable=False)

    # datoer
    dato = db.Column(db.DateTime, default=datetime.utcnow)
    forfallsdato = db.Column(db.DateTime)

    # status
    status = db.Column(db.String(20), default="utkast")
    betalt_dato = db.Column(db.DateTime)

    # kommentar
    kommentar = db.Column(db.Text)

    # koblinger
    kunde_id = db.Column(db.Integer, db.ForeignKey("kunde.id"))
    user_id = db.Column(db.Integer, db.ForeignKey("bruker.id"), nullable=False)


class Sender(db.Model):
    id = db.Column(db.Integer, primary_key=True)

    firmanavn = db.Column(db.String(150))
    orgnr = db.Column(db.String(50))
    adresse = db.Column(db.String(200))

    bank = db.Column(db.String(100))
    telefon = db.Column(db.String(50))
    iban = db.Column(db.String(100))
    swift = db.Column(db.String(100))
    referanse = db.Column(db.String(100))
    kid = db.Column(db.String(100))

    user_id = db.Column(
        db.Integer,
        db.ForeignKey("bruker.id"),
        nullable=False
    )

    bruker = db.relationship(
        "Bruker",
        backref=db.backref("sender", uselist=False)
    )
