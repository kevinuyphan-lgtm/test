from fpdf import FPDF
from io import BytesIO
import os


class Klientens_firma:
    def __init__(self, firmanavn, firmaadresse, orgnr, referanse):
        self.firmanavn = firmanavn
        self.firmaadresse = firmaadresse
        self.orgnr = orgnr
        self.referanse = referanse


class Produkt:
    def __init__(self, navn, antall, pris):
        self.navn = navn
        self.antall = int(antall) if antall else 0
        self.pris = float(pris) if pris else 0.0
        self.sum = self.antall * self.pris


class Vårt_firma:
    def __init__(self, navn, addresse, navn_på_bank, orgnr, telefon, IBAN, swift_bic, vår_referanse, KID):
        self.navn = navn
        self.addresse = addresse
        self.navn_på_bank = navn_på_bank
        self.orgnr = orgnr
        self.telefon = telefon
        self.iban = IBAN
        self.swift_bic = swift_bic
        self.vår_referanse = vår_referanse
        self.kid = KID


def generate_invoice_pdf(invoice_data):
    pdf = FPDF()
    pdf.add_page()
    pdf.set_auto_page_break(auto=True, margin=15)

    # -----------------------
    # Logo
    # -----------------------
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    image_path = os.path.join(BASE_DIR, "nettside", "static", "bilder", "placeholder.jpeg")

    if os.path.exists(image_path):
        pdf.image(image_path, x=15, y=10, w=40)

    pdf.set_y(60)
    pdf.line(25, pdf.get_y(), 185, pdf.get_y())
    pdf.ln(10)

    # -----------------------
    # Klient
    # -----------------------
    klient = Klientens_firma(
        invoice_data.get("firmanavn", ""),
        invoice_data.get("firmaadresse", ""),
        invoice_data.get("orgnr", ""),
        invoice_data.get("referanse", "")
    )

    fakturadato = invoice_data.get("invoice_date", "")
    forfallsdato = invoice_data.get("due_date", "")
    fakturanummer = invoice_data.get("invoice_number", "")

    pdf.set_font("Arial", "", 12)
    pdf.cell(90, 7, "Fakturert til:", ln=False)
    pdf.cell(0, 7, f"Fakturadato: {fakturadato}", ln=True, align="R")

    pdf.set_font("Arial", "B", 12)
    pdf.cell(90, 7, klient.firmanavn, ln=False)
    pdf.cell(0, 7, f"Forfallsdato: {forfallsdato}", ln=True, align="R")

    pdf.set_font("Arial", "", 12)
    pdf.cell(90, 7, klient.firmaadresse, ln=False)
    pdf.cell(0, 7, f"Org.nr.: {klient.orgnr}", ln=True, align="R")

    pdf.cell(90, 7, f"Deres ref.: {klient.referanse}", ln=True)

    pdf.ln(10)

    # -----------------------
    # Fakturanummer
    # -----------------------
    pdf.set_font("Arial", "B", 20)
    pdf.cell(0, 15, f"Fakturanr. {fakturanummer}", ln=True, align="C")

    pdf.ln(5)
    pdf.line(25, pdf.get_y(), 185, pdf.get_y())
    pdf.ln(5)

    # -----------------------
    # Produkter
    # -----------------------
    pdf.set_font("Arial", "B", 12)
    pdf.cell(90, 7, "Beskrivelse")
    pdf.cell(30, 7, "Antall", 0, 0, "C")
    pdf.cell(30, 7, "Pris", 0, 0, "R")
    pdf.cell(0, 7, "Sum", 0, 1, "R")

    pdf.set_font("Arial", "", 12)

    total = 0
    for p in invoice_data.get("produkter", []):
        produkt = Produkt(p["navn"], p["antall"], p["pris"])

        pdf.cell(90, 7, produkt.navn)
        pdf.cell(30, 7, str(produkt.antall), 0, 0, "C")
        pdf.cell(30, 7, f"{produkt.pris:.2f}", 0, 0, "R")
        pdf.cell(0, 7, f"{produkt.sum:.2f}", 0, 1, "R")

        total += produkt.sum

    pdf.ln(5)

    mva = total * 0.25
    total_sum = total + mva

    pdf.set_font("Arial", "", 12)
    pdf.cell(0, 7, f"Sum: {total:.2f}", 0, 1, "R")
    pdf.cell(0, 7, f"MVA (25%): {mva:.2f}", 0, 1, "R")

    pdf.set_font("Arial", "B", 12)
    pdf.cell(0, 7, f"Sum å betale: {total_sum:.2f}", 0, 1, "R")

    pdf.ln(5)
    pdf.line(25, pdf.get_y(), 185, pdf.get_y())
    pdf.ln(5)

    # -----------------------
    # Vårt firma
    # -----------------------
    from tjenester import STANDARD_VAART_FIRMA

    vf_data = {
        **STANDARD_VAART_FIRMA,
        **invoice_data.get("vårt_firma", {})
    }

    vf = Vårt_firma(
        vf_data["navn"],
        vf_data["addresse"],
        vf_data["navn_på_bank"],
        vf_data["orgnr"],
        vf_data["telefon"],
        vf_data["IBAN"],
        vf_data["swift_bic"],
        vf_data["vår_referanse"],
        vf_data["KID"]
    )

    pdf.set_font("Arial", "B", 12)
    pdf.cell(60, 7, vf.navn, ln=False)
    pdf.cell(60, 7, vf.addresse, ln=False)
    pdf.cell(0, 7, vf.navn_på_bank, ln=True, align="R")

    pdf.set_font("Arial", "", 12)
    pdf.cell(60, 7, f"Org.nr: {vf.orgnr}", ln=False)
    pdf.cell(60, 7, f"Tlf: {vf.telefon}", ln=False)
    pdf.cell(0, 7, f"IBAN: {vf.iban}", ln=True, align="R")

    pdf.cell(0, 7, "Foretaksregisteret", ln=False)
    pdf.cell(60, 7, "", ln=False)
    pdf.cell(0, 7, f"SWIFT/BIC: {vf.swift_bic}", ln=True, align="R")

    pdf.cell(0, 7, f"Vår ref.: {vf.vår_referanse}", ln=False)
    pdf.cell(60, 7, "", ln=False)
    pdf.cell(0, 7, f"KID: {vf.kid}", ln=True, align="R")

    pdf_bytes = pdf.output(dest="S")
    return BytesIO(pdf_bytes)
