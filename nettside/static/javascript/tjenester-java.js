document.addEventListener("DOMContentLoaded", () => {

    const firmanavnInput = document.getElementById("firmanavn");
    const adresseInput = document.getElementById("firmaadresse");
    const orgnrInput = document.getElementById("orgnr");
    const referanseInput = document.getElementById("referanse");

    const invoiceDateInput = document.getElementById("invoice_date");
    const daysInput = document.getElementById("forfalls_dager");
    const dueDateDisplay = document.getElementById("due_date_display");
    const dueDateHidden = document.getElementById("due_date");

    // ==============================
    // SETT DAGENS DATO
    // ==============================
    const today = new Date();
    const isoToday = today.toISOString().split("T")[0];
    invoiceDateInput.value = isoToday;

    // ==============================
    // AUTOFYLL KUNDE
    // ==============================
    const kunderDatalist = document.getElementById("kunder_list").options;
    const kunderMap = {};

    for (let i = 0; i < kunderDatalist.length; i++) {
        const opt = kunderDatalist[i];
        kunderMap[opt.value] = {
            adresse: opt.dataset.adresse || "",
            orgnr: opt.dataset.orgnr || "",
            referanse: opt.dataset.referanse || ""
        };
    }

    firmanavnInput.addEventListener("input", () => {
        const kunde = kunderMap[firmanavnInput.value];

        if (kunde) {
            adresseInput.value = kunde.adresse;
            orgnrInput.value = kunde.orgnr;
            referanseInput.value = kunde.referanse;
        } else {
            adresseInput.value = "";
            orgnrInput.value = "";
            referanseInput.value = "";
        }
    });

    // ==============================
    // FORFALLSDATO LOGIKK
    // ==============================
    function oppdaterForfallsDato() {
        const fakturaDato = new Date(invoiceDateInput.value);
        const dager = parseInt(daysInput.value) || 0;

        fakturaDato.setDate(fakturaDato.getDate() + dager);

        const iso = fakturaDato.toISOString().split("T")[0];
        dueDateHidden.value = iso;

        // norsk visning: 25.11.2025
        dueDateDisplay.value = fakturaDato.toLocaleDateString("no-NO");
    }

    daysInput.addEventListener("input", oppdaterForfallsDato);
    invoiceDateInput.addEventListener("change", oppdaterForfallsDato);

    // Kjør ved start
    oppdaterForfallsDato();
});
