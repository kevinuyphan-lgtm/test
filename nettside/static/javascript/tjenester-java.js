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
