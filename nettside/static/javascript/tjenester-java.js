document.addEventListener("DOMContentLoaded", () => {

    // Sett dagens dato som fakturadato og lås feltet:
    const invoiceDateInput = document.getElementById("invoice_date");
    const today = new Date();
    invoiceDateInput.value = today.toISOString().split("T")[0];

    const daysInput = document.getElementById("forfalls_dager");
    const displayField = document.getElementById("due_date_display");
    const hiddenField = document.getElementById("due_date");

    function oppdaterForfallsDato() {
        const baseDate = new Date(invoiceDateInput.value);
        const days = parseInt(daysInput.value);

        baseDate.setDate(baseDate.getDate() + days);

        const iso = baseDate.toISOString().split("T")[0];
        hiddenField.value = iso;

        displayField.value = baseDate.toLocaleDateString("no-NO");
    }

    // Kjør én gang ved innlasting:
    oppdaterForfallsDato();

    // Oppdater når antall dager endres:
    daysInput.addEventListener("input", oppdaterForfallsDato);
});

document.addEventListener("DOMContentLoaded", function() {
    const firmanavnInput = document.getElementById("firmanavn");
    const adresseInput = document.getElementById("firmaadresse");
    const orgnrInput = document.getElementById("orgnr");
    const referanseInput = document.getElementById("referanse");

    // Lag et objekt med kundedata fra datalisten
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

    // Autofyll når brukeren velger/skriv inn navn
    firmanavnInput.addEventListener("input", function() {
        const val = firmanavnInput.value;
        if (kunderMap[val]) {
            adresseInput.value = kunderMap[val].adresse;
            orgnrInput.value = kunderMap[val].orgnr;
            referanseInput.value = kunderMap[val].referanse;
        } else {
            adresseInput.value = "";
            orgnrInput.value = "";
            referanseInput.value = "";
        }
    });

    // Sett dagens dato som default fakturadato
    const invoiceDateInput = document.getElementById("invoice_date");
    const today = new Date().toISOString().split('T')[0];
    invoiceDateInput.value = today;

    // Oppdater forfallsdato automatisk
    const forfallsInput = document.getElementById("forfalls_dager");
    const dueDisplay = document.getElementById("due_date_display");
    const dueHidden = document.getElementById("due_date");

    function updateDueDate() {
        const days = parseInt(forfallsInput.value) || 7;
        const invoiceDate = new Date(invoiceDateInput.value);
        const dueDate = new Date(invoiceDate);
        dueDate.setDate(invoiceDate.getDate() + days);
        const dueStr = dueDate.toISOString().split('T')[0];
        dueDisplay.value = dueStr;
        dueHidden.value = dueStr;
    }

    forfallsInput.addEventListener("input", updateDueDate);
    invoiceDateInput.addEventListener("change", updateDueDate);

    updateDueDate();
});

