from system.extensions import db
from datetime import datetime

class Bruker(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    navn = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password_hash = db.Column(db.String(200), nullable=False)
    faktura_teller = db.Column(db.Integer, default=1000)
    fakturaer = db.relationship('Faktura', backref='bruker', lazy=True)
    kunder = db.relationship('Kunde', backref='bruker', lazy=True)

class Kunde(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    navn = db.Column(db.String(150), nullable=False)
    epost = db.Column(db.String(150))
    telefon = db.Column(db.String(50))
    adresse = db.Column(db.String(200))
    orgnr = db.Column(db.String(50))
    referanse = db.Column(db.String(100))
    user_id = db.Column(db.Integer, db.ForeignKey('bruker.id'), nullable=False)
    firmanavn = db.Column(db.String(150))
    land = db.Column(db.String(50))

class Faktura(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    filnavn = db.Column(db.String(100), nullable=False)
    dato = db.Column(db.DateTime, default=datetime.utcnow)
    status = db.Column(db.String(20), default="utkast")
    betalt_dato = db.Column(db.DateTime, nullable=True)
    user_id = db.Column(db.Integer, db.ForeignKey('bruker.id'), nullable=False)

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
        db.ForeignKey('bruker.id'),
        nullable=False
    )

    bruker = db.relationship('Bruker', backref=db.backref('sender', uselist=False))
