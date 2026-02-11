document.addEventListener("DOMContentLoaded", () => {

    /* ===============================
       DATO / FORFALL
    =============================== */
    const invoiceDateInput = document.getElementById("invoice_date");
    const today = new Date();
    invoiceDateInput.value = today.toISOString().split("T")[0];

    const daysInput = document.getElementById("forfalls_dager");
    const displayField = document.getElementById("due_date_display");
    const hiddenField = document.getElementById("due_date");

    function oppdaterForfallsDato() {
        const baseDate = new Date(invoiceDateInput.value);
        const days = parseInt(daysInput.value) || 7;
        baseDate.setDate(baseDate.getDate() + days);

        const iso = baseDate.toISOString().split("T")[0];
        hiddenField.value = iso;
        displayField.value = baseDate.toLocaleDateString("no-NO");
    }

    oppdaterForfallsDato();
    daysInput.addEventListener("input", oppdaterForfallsDato);
    invoiceDateInput.addEventListener("change", oppdaterForfallsDato);


    /* ===============================
       AUTOFYLL KUNDE
    =============================== */
    const firmanavnInput = document.getElementById("firmanavn");
    const adresseInput = document.getElementById("firmaadresse");
    const orgnrInput = document.getElementById("orgnr");
    const referanseInput = document.getElementById("referanse");

    const datalist = document.getElementById("kunder_list");
    const kunderMap = {};

    if (datalist) {
        Array.from(datalist.options).forEach(opt => {
            kunderMap[opt.value] = {
                adresse: opt.dataset.adresse || "",
                orgnr: opt.dataset.orgnr || "",
                referanse: opt.dataset.referanse || ""
            };
        });
    }

    firmanavnInput?.addEventListener("input", () => {
        const v = firmanavnInput.value;
        if (kunderMap[v]) {
            adresseInput.value = kunderMap[v].adresse;
            orgnrInput.value = kunderMap[v].orgnr;
            referanseInput.value = kunderMap[v].referanse;
        }
    });


    /* ===============================
       PRODUKTER
    =============================== */
    const produkterContainer = document.getElementById("produkter-container");
    const leggTilKnapp = document.querySelector(".secondary-btn");

    function nyProduktRad(navn = "", antall = 1, pris = "") {

        const row = document.createElement("div");
        row.className = "produkt-row product-card";

        row.innerHTML = `
            <input type="text" name="produkt_navn[]" placeholder="Produkt" value="${navn}" required>
            <input type="number" name="produkt_antall[]" placeholder="Antall" min="1" value="${antall}" required>
            <input type="number" step="0.01" name="produkt_pris[]" placeholder="Pris" min="0" value="${pris}" required>
            <button type="button" class="remove-product-btn">Fjern</button>
        `;

        // Smooth appear animation
        row.style.opacity = "0";
        row.style.transform = "translateY(8px)";

        setTimeout(() => {
            row.style.transition = "0.2s ease";
            row.style.opacity = "1";
            row.style.transform = "translateY(0)";
        }, 10);

        row.querySelector(".remove-product-btn").addEventListener("click", () => {
            row.remove();
            oppdaterTotal();
        });

        return row;
    }

    // Init eksisterende rader
    if (produkterContainer) {

        if (produkterContainer.children.length === 0) {
            produkterContainer.appendChild(nyProduktRad());
        }

        // Legg til fjern-knapp hvis mangler
        Array.from(produkterContainer.querySelectorAll(".produkt-row")).forEach(r => {
            if (!r.querySelector(".remove-product-btn")) {
                const btn = document.createElement("button");
                btn.type = "button";
                btn.textContent = "Fjern";
                btn.className = "remove-product-btn";
                btn.addEventListener("click", () => {
                    r.remove();
                    oppdaterTotal();
                });
                r.appendChild(btn);
            }
        });
    }

    // Legg til ny rad
    leggTilKnapp?.addEventListener("click", () => {

        const sisteRad = produkterContainer.querySelector(".produkt-row:last-child");

        if (sisteRad) {
            const navnVal = sisteRad.querySelector('input[name="produkt_navn[]"]')?.value.trim();
            const prisVal = sisteRad.querySelector('input[name="produkt_pris[]"]')?.value.trim();

            if (!navnVal || !prisVal) {
                sisteRad.querySelector('input[name="produkt_navn[]"]')?.focus();
                return;
            }
        }

        produkterContainer.appendChild(nyProduktRad());
    });


    /* ===============================
       TOTAL BEREGNING
    =============================== */
    function beregnTotal() {
        const rader = Array.from(produkterContainer.querySelectorAll(".produkt-row"));
        let total = 0;

        rader.forEach(r => {
            const a = parseFloat(r.querySelector('input[name="produkt_antall[]"]')?.value || 0);
            const p = parseFloat(r.querySelector('input[name="produkt_pris[]"]')?.value || 0);
            total += (a * p);
        });

        return total;
    }

    function oppdaterTotal() {
        const total = beregnTotal();
        console.log("Total:", total.toFixed(2));
        // Her kan vi senere vise total i UI
    }

    produkterContainer?.addEventListener("input", (e) => {
        if (e.target.matches('input[name="produkt_antall[]"], input[name="produkt_pris[]"]')) {
            oppdaterTotal();
        }
    });

});
