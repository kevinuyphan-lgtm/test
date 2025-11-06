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

    # --- Logo ---
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    image_path = os.path.join(BASE_DIR, "nettside", "static", "bilder", "placeholder.jpeg")
    if os.path.exists(image_path):
        pdf.image(image_path, x=15, y=10, w=40)
    else:
        print("Advarsel: bilde ikke funnet ->", image_path)

    pdf.set_y(60)
    pdf.line(25, pdf.get_y(), 185, pdf.get_y())
    pdf.ln(10)

    # --- Klientinfo ---
    klient = Klientens_firma(
        invoice_data.get("firmanavn", ""),
        invoice_data.get("firmaadresse", ""),
        invoice_data.get("orgnr", ""),
        invoice_data.get("referanse", "")
    )

    fakturadato = invoice_data.get("invoice_date", "")
    forfallsdato = invoice_data.get("due_date", "")

    # Sørg for at fakturadato og forfallsdato alltid er strenger
    if hasattr(fakturadato, "strftime"):
        fakturadato = fakturadato.strftime("%Y-%m-%d")
    if hasattr(forfallsdato, "strftime"):
        forfallsdato = forfallsdato.strftime("%Y-%m-%d")

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

    # --- Fakturanummer ---
    templates_dir = os.path.join(BASE_DIR, "invoice_data")
    filnavn = os.path.join(templates_dir, "last_invoice_number.txt")
    os.makedirs(templates_dir, exist_ok=True)

    if not os.path.exists(filnavn):
        with open(filnavn, "w") as f:
            f.write("1000")

    with open(filnavn, "r") as f:
        fakturanummer = int(f.read().strip())

    with open(filnavn, "w") as f:
        f.write(str(fakturanummer + 1))

    pdf.set_font("Arial", "B", 20)
    pdf.cell(0, 15, f"Fakturanr. {fakturanummer}", ln=True, align="C")

    pdf.ln(5)
    pdf.line(25, pdf.get_y(), 185, pdf.get_y())
    pdf.ln(5)

    # --- Produkttabell ---
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

    # --- Vårt firma info ---
    vf_data = invoice_data.get("vårt_firma", {})
    vf = Vårt_firma(
        vf_data.get("navn", "KIT Consult AS"),
        vf_data.get("addresse", "Vollebekkveien 2L, 0598 Oslo"),
        vf_data.get("navn_på_bank", "DNB"),
        vf_data.get("orgnr", "999888777"),
        vf_data.get("telefon", "+47 455 61 585"),
        vf_data.get("IBAN", "123 123 123"),
        vf_data.get("swift_bic", "DNBANOKKXXX"),
        vf_data.get("vår_referanse", "Kevin"),
        vf_data.get("KID", "123456789")
    )

    pdf.set_font("Arial", "B", 12)
    pdf.cell(60, 7, vf.navn, ln=False)
    pdf.cell(60, 7, vf.addresse, ln=False, align="L")
    pdf.cell(0, 7, vf.navn_på_bank, ln=True, align="R")

    pdf.set_font("Arial", "", 12)
    pdf.cell(60, 7, f"Org.nr: {vf.orgnr}", ln=False)
    pdf.cell(60, 7, f"Tlf: {vf.telefon}", ln=False, align="L")
    pdf.cell(0, 7, f"IBAN: {vf.iban}", ln=True, align="R")
    pdf.cell(0, 7, "Foretaksregisteret", ln=False, align="L")
    pdf.cell(60, 7, "", ln=False, align="L")
    pdf.cell(0, 7, f"SWIFT/BIC: {vf.swift_bic}", ln=True, align="R")
    pdf.cell(0, 7, f"Vår ref.: {vf.vår_referanse}", ln=False, align="L")
    pdf.cell(60, 7, "", ln=False, align="L")
    pdf.cell(0, 7, f"KID: {vf.kid}", ln=True, align="R")

    pdf_bytes = pdf.output(dest="S")  # returnerer bytes
    return BytesIO(pdf_bytes)
