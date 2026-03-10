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
    except:
        return default


def safe_int(value, default=0):
    try:
        return int(value)
    except:
        return default


# =========================
# MODELLER
# =========================

class Klient:
    def __init__(self, data):
        self.firmanavn = data.get("firmanavn", "")
        self.adresse = data.get("firmaadresse", "")
        self.ordernr = data.get("ordernr", "")
        self.referanse = data.get("referanse", "")


class Produkt:
    def __init__(self, data):
        self.navn = data.get("navn", "")
        self.antall = safe_int(data.get("antall"))
        self.pris = safe_float(data.get("pris"))
        self.mva = safe_float(data.get("mva"), 25)

        self.sum = round(self.antall * self.pris, 2)
        self.mva_belop = round(self.sum * (self.mva / 100), 2)
        self.total = round(self.sum + self.mva_belop, 2)


class VartFirma:
    def __init__(self, data):
        self.navn = data.get("navn", "")
        self.adresse = data.get("addresse", "")
        self.bank = data.get("navn_på_bank", "")
        self.orgnr = data.get("orgnr", "")
        self.telefon = data.get("telefon", "")
        self.iban = data.get("IBAN", "")
        self.swift = data.get("swift_bic", "")
        self.referanse = data.get("vår_referanse", "")
        self.kid = data.get("KID", "")


# =========================
# PDF GENERATOR
# =========================

def generate_invoice_pdf(invoice_data):

    pdf = FPDF()
    pdf.add_page()
    pdf.set_auto_page_break(False)

    firma = VartFirma(invoice_data.get("vårt_firma", {}))
    klient = Klient(invoice_data)

    fakturadato = invoice_data.get("invoice_date", "")
    forfallsdato = invoice_data.get("due_date", "")
    fakturanummer = invoice_data.get("invoice_number", "")
    kundenummer = invoice_data.get("kundenummer", "")
    kommentar = invoice_data.get("kommentar", "")

    produkter = [Produkt(p) for p in invoice_data.get("produkter", [])]

    # =========================
    # HEADER
    # =========================

    pdf.set_font("Arial", "B", 14)
    pdf.cell(0, 7, firma.navn, ln=True)

    pdf.set_font("Arial", "", 12)
    pdf.cell(0, 7, firma.adresse, ln=True)
    pdf.cell(0, 7, f"Tlf: {firma.telefon}", ln=True)

    pdf.ln(5)
    pdf.set_draw_color(180,180,180)
    pdf.line(25, pdf.get_y(), 185, pdf.get_y())
    pdf.set_draw_color(0,0,0)

    pdf.ln(10)

    # =========================
    # FAKTURERT TIL
    # =========================

    pdf.cell(100, 7, "Fakturert til:")
    pdf.cell(0, 7, f"Fakturadato: {fakturadato}", ln=True, align="R")

    pdf.set_font("Arial", "B", 12)
    pdf.cell(100, 7, klient.firmanavn)
    pdf.set_font("Arial", "", 12)
    pdf.cell(0, 7, f"Forfallsdato: {forfallsdato}", ln=True, align="R")

    pdf.cell(100, 7, klient.adresse)
    pdf.cell(0, 7, f"Order nr: {klient.ordernr}", ln=True, align="R")

    pdf.cell(100, 7, f"Deres ref: {klient.referanse}")
    pdf.cell(0, 7, f"Kundenr: {kundenummer}", ln=True, align="R")

    if kommentar:
        pdf.cell(100,7,f"Kommentar: {kommentar}", ln=True)

    pdf.ln(10)

    # =========================
    # FAKTURATITTEL
    # =========================

    pdf.set_font("Arial","B",22)
    pdf.cell(0,12,f"FAKTURA {fakturanummer}",ln=True,align="C")

    pdf.ln(6)
    pdf.set_draw_color(180,180,180)
    pdf.line(25,pdf.get_y(),185,pdf.get_y())
    pdf.set_draw_color(0,0,0)

    pdf.ln(10)

    # =========================
    # PRODUKTTABELL
    # =========================

    desc_w = 90
    qty_w = 15
    price_w = 25
    sum_ex_w = 30
    sum_inc_w = 30

    pdf.set_font("Arial","B",11)

    pdf.cell(desc_w,8,"Beskrivelse")
    pdf.cell(qty_w,8,"Antall",0,0,"C")
    pdf.cell(price_w,8,"Pris",0,0,"R")
    pdf.cell(sum_ex_w,8,"Sum eks. mva",0,0,"R")
    pdf.cell(sum_inc_w,8,"Sum inkl. mva",0,1,"R")

    pdf.set_draw_color(180,180,180)
    pdf.line(25,pdf.get_y(),185,pdf.get_y())
    pdf.set_draw_color(0,0,0)

    pdf.ln(5)

    pdf.set_font("Arial","",12)

    total_ex = 0
    mva_totals = {}

    for produkt in produkter:

        pdf.cell(desc_w,9,produkt.navn)
        pdf.cell(qty_w,9,str(produkt.antall),0,0,"C")
        pdf.cell(price_w,9,format_currency(produkt.pris),0,0,"R")
        pdf.cell(sum_ex_w,9,format_currency(produkt.sum),0,0,"R")
        pdf.cell(sum_inc_w,9,format_currency(produkt.total),0,1,"R")

        total_ex += produkt.sum
        mva_totals[produkt.mva] = mva_totals.get(produkt.mva,0) + produkt.mva_belop

    total_mva = sum(mva_totals.values())
    total_sum = total_ex + total_mva

    # =========================
    # SUM BLOKK
    # =========================

    bottom_margin = 15
    footer_height = 45

    sum_height = 10 + (len(mva_totals)*7) + 12
    sum_y = pdf.h - bottom_margin - footer_height - sum_height

    pdf.set_y(sum_y)

    label_w = 130
    value_w = 45

    pdf.cell(label_w,7,"Sum eks. mva",0,0,"R")
    pdf.cell(value_w,7,f"{format_currency(total_ex)} kr",0,1,"R")

    for sats,belop in sorted(mva_totals.items()):
        pdf.cell(label_w,7,f"MVA {int(sats)}%",0,0,"R")
        pdf.cell(value_w,7,f"{format_currency(belop)} kr",0,1,"R")

    pdf.ln(2)
    pdf.set_line_width(0.6)
    pdf.line(120,pdf.get_y(),185,pdf.get_y())
    pdf.set_line_width(0.2)

    pdf.ln(2)

    pdf.set_font("Arial","B",16)
    pdf.cell(label_w,8,"Å betale",0,0,"R")
    pdf.cell(value_w,8,f"{format_currency(total_sum)} kr",0,1,"R")

    # =========================
    # FOOTER
    # =========================

    footer_y = pdf.h - 45
    pdf.set_y(footer_y)

    pdf.set_draw_color(180,180,180)
    pdf.line(25,pdf.get_y(),185,pdf.get_y())
    pdf.set_draw_color(0,0,0)

    pdf.ln(8)

    col1 = 65
    col2 = 60
    col3 = 60

    pdf.set_font("Arial","B",11)

    pdf.cell(col1,6,"Firma")
    pdf.cell(col2,6,"Kontakt")
    pdf.cell(col3,6,"Betalingsinformasjon",ln=True)

    pdf.set_font("Arial","",11)

    pdf.cell(col1,6,firma.navn)
    pdf.cell(col2,6,f"Tlf: {firma.telefon}")
    pdf.cell(col3,6,f"Bank: {firma.bank}",ln=True)

    pdf.cell(col1,6,f"Org.nr: {firma.orgnr}")
    pdf.cell(col2,6,"")
    pdf.cell(col3,6,f"IBAN: {firma.iban}",ln=True)

    pdf.cell(col1,6,f"Adresse: {firma.adresse}")
    pdf.cell(col2,6,f"Vår ref: {firma.referanse}")
    pdf.cell(col3,6,f"SWIFT: {firma.swift}",ln=True)

    pdf.cell(col1,6,"")
    pdf.cell(col2,6,"")
    pdf.cell(col3,6,f"KID: {firma.kid}",ln=True)

    pdf_bytes = pdf.output(dest="S")
    return BytesIO(pdf_bytes)
