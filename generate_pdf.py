from fpdf import FPDF
from io import BytesIO


# =========================
# HJELPEFUNKSJONER
# =========================

def format_currency(value):
    return f"{value:,.2f}".replace(",", " ").replace(".", ",")


def safe_float(value, default=0.0):
    try:
        if isinstance(value, str):
            value = value.replace(",", ".")
        return float(value)
    except (TypeError, ValueError):
        return default


def safe_int(value, default=0):
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


# =========================
# MODELLER
# =========================

class Klientens_firma:
    def __init__(self, firmanavn, firmaadresse, orgnr, referanse):
        self.firmanavn = firmanavn or ""
        self.firmaadresse = firmaadresse or ""
        self.orgnr = orgnr or ""
        self.referanse = referanse or ""


class Produkt:
    def __init__(self, navn, antall, pris):
        self.navn = navn or ""
        self.antall = safe_int(antall)
        self.pris = safe_float(pris)
        self.sum = round(self.antall * self.pris, 2)


class VartFirma:
    def __init__(self, data: dict):
        self.navn = data.get("navn", "")
        self.addresse = data.get("addresse", "")
        self.navn_på_bank = data.get("navn_på_bank", "")
        self.orgnr = data.get("orgnr", "")
        self.telefon = data.get("telefon", "")
        self.iban = data.get("IBAN", "")
        self.swift_bic = data.get("swift_bic", "")
        self.vår_referanse = data.get("vår_referanse", "")
        self.kid = data.get("KID", "")


# =========================
# PDF GENERATOR
# =========================

def generate_invoice_pdf(invoice_data):

    pdf = FPDF()
    pdf.add_page()
    pdf.set_auto_page_break(auto=True, margin=15)

    vf = VartFirma(invoice_data.get("vårt_firma", {}))

    fakturadato = invoice_data.get("invoice_date", "")
    forfallsdato = invoice_data.get("due_date", "")
    fakturanummer = invoice_data.get("invoice_number", "")
    kundenummer = invoice_data.get("kundenummer", "")
    kommentar = invoice_data.get("kommentar", "")

    # -----------------------
    # HEADER
    # -----------------------
    
    pdf.set_font("Arial", "B", 14)
    pdf.cell(100, 7, vf.navn)
    
    pdf.set_font("Arial", "", 12)
    pdf.cell(100, 7, vf.addresse)
    pdf.cell(0, 7, "", ln=True)
    
    pdf.cell(100, 7, f"Tlf: {vf.telefon}")
    pdf.cell(0, 7, "", ln=True)
    
    pdf.ln(5)
    pdf.line(25, pdf.get_y(), 185, pdf.get_y())
    pdf.ln(10)

    # -----------------------
    # FAKTURERT TIL
    # -----------------------
    
    klient = Klientens_firma(
        invoice_data.get("firmanavn"),
        invoice_data.get("firmaadresse"),
        invoice_data.get("orgnr"),
        invoice_data.get("referanse"),
    )
    
    pdf.set_font("Arial", "", 12)
    pdf.cell(100, 7, "Fakturert til:")
    pdf.cell(0, 7, f"Fakturadato: {fakturadato}", ln=True, align="R")
    
    pdf.set_font("Arial", "B", 12)
    pdf.cell(100, 7, klient.firmanavn)
    pdf.cell(0, 7, f"Forfallsdato: {forfallsdato}", ln=True, align="R")
    
    pdf.set_font("Arial", "", 12)
    pdf.cell(100, 7, klient.firmaadresse)
    pdf.cell(0, 7, f"Org.nr.: {vf.orgnr}", ln=True, align="R")

    pdf.cell(100, 7, f"Deres ref.: {klient.referanse}")
    pdf.cell(0, 7, f"Kundenr: {kundenummer}", ln=True, align="R")
    
    if kommentar:
        pdf.cell(100, 7, f"Kommentar: {kommentar}", ln=True)
    
    pdf.ln(10)

    # -----------------------
    # FAKTURATITTEL
    # -----------------------

    pdf.set_font("Arial", "B", 20)
    pdf.cell(0, 15, f"FAKTURA {fakturanummer}", ln=True, align="C")

    pdf.ln(5)
    pdf.line(25, pdf.get_y(), 185, pdf.get_y())
    pdf.ln(8)

    # -----------------------
    # PRODUKTTABELL
    # -----------------------

    pdf.set_font("Arial", "B", 12)
    pdf.cell(90, 8, "Beskrivelse")
    pdf.cell(25, 8, "Antall", 0, 0, "C")
    pdf.cell(30, 8, "Pris", 0, 0, "R")
    pdf.cell(0, 8, "Sum inkl. mva", 0, 1, "R")

    pdf.line(25, pdf.get_y(), 185, pdf.get_y())
    pdf.ln(3)

    pdf.set_font("Arial", "", 12)

    produkter = invoice_data.get("produkter") or []

    total_ex_mva = 0

    for p in produkter:

        produkt = Produkt(
            p.get("navn"),
            p.get("antall"),
            p.get("pris"),
        )

        mva_sats = safe_float(p.get("mva"), 25)

        mva_belop = round(produkt.sum * (mva_sats / 100), 2)
        linje_total = round(produkt.sum + mva_belop, 2)

        pdf.cell(90, 8, produkt.navn)
        pdf.cell(25, 8, str(produkt.antall), 0, 0, "C")
        pdf.cell(30, 8, format_currency(produkt.pris), 0, 0, "R")
        pdf.cell(0, 8, format_currency(linje_total), 0, 1, "R")

        total_ex_mva += produkt.sum

    # -----------------------
    # SUMMER
    # -----------------------

    total_mva = 0

    for p in produkter:
        sats = safe_float(p.get("mva"), 25)
        grunnlag = safe_int(p.get("antall")) * safe_float(p.get("pris"))
        total_mva += grunnlag * (sats / 100)

    total_mva = round(total_mva, 2)
    total_sum = round(total_ex_mva + total_mva, 2)

    bottom_margin = 15
    footer_height = 40

    mva_lines = 0
    for sats in [25, 15, 12, 0]:
        for p in produkter:
            if int(safe_float(p.get("mva"), 25)) == sats:
                mva_lines += 1
                break

    sum_block_height = 12 + (mva_lines * 7) + 12

    sum_y = pdf.h - bottom_margin - footer_height - sum_block_height
    pdf.set_y(sum_y)

    label_width = 140
    value_width = 40

    pdf.set_font("Arial", "", 12)

    pdf.cell(label_width, 7, "Sum eks. mva", 0, 0, "R")
    pdf.cell(value_width, 7, f"{format_currency(total_ex_mva)} kr", 0, 1, "R")

    for sats in [25, 15, 12, 0]:

        grunnlag = 0

        for p in produkter:
            if int(safe_float(p.get("mva"), 25)) == sats:
                grunnlag += safe_int(p.get("antall")) * safe_float(p.get("pris"))

        mva_belop = round(grunnlag * (sats / 100), 2)

        if mva_belop > 0:
            pdf.cell(label_width, 7, f"MVA {sats}%", 0, 0, "R")
            pdf.cell(value_width, 7, f"{format_currency(mva_belop)} kr", 0, 1, "R")

    pdf.ln(2)
    pdf.line(110, pdf.get_y(), 185, pdf.get_y())
    pdf.ln(2)

    pdf.set_font("Arial", "B", 14)
    pdf.cell(label_width, 8, "Å betale", 0, 0, "R")
    pdf.cell(value_width, 8, f"{format_currency(total_sum)} kr", 0, 1, "R")

    # -----------------------
    # FOOTER
    # -----------------------

    footer_height = 36
    bottom_margin = 15

    footer_y = pdf.h - bottom_margin - footer_height
    pdf.set_y(footer_y)

    pdf.line(25, pdf.get_y(), 185, pdf.get_y())
    pdf.ln(8)

    pdf.set_font("Arial", "B", 12)
    pdf.cell(60, 7, vf.navn)
    pdf.cell(60, 7, vf.addresse)
    pdf.cell(0, 7, vf.navn_på_bank, ln=True, align="R")

    pdf.set_font("Arial", "", 12)
    pdf.cell(60, 7, f"Org.nr: {vf.orgnr}")
    pdf.cell(60, 7, f"Tlf: {vf.telefon}")
    pdf.cell(0, 7, f"IBAN: {vf.iban}", ln=True, align="R")

    pdf.cell(60, 7, "Foretaksregisteret")
    pdf.cell(60, 7, "")
    pdf.cell(0, 7, f"SWIFT/BIC: {vf.swift_bic}", ln=True, align="R")

    pdf.cell(60, 7, f"Vår ref.: {vf.vår_referanse}")
    pdf.cell(60, 7, "")
    pdf.cell(0, 7, f"KID: {vf.kid}", ln=True, align="R")

    pdf_bytes = pdf.output(dest="S")
    return BytesIO(pdf_bytes)
