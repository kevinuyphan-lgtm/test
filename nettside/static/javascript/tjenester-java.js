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
    const leggTilKnapp = document.querySelector(".card-header .secondary-btn");

    function nyProduktRad(navn = "", antall = 1, pris = "") {
        const row = document.createElement("div");
        row.className = "produkt-row product-card";

        row.innerHTML = `
            <input type="text" name="produkt_navn[]" placeholder="Produkt" value="${navn}" required>
            <input type="number" name="produkt_antall[]" placeholder="Antall" min="1" value="${antall}" required>
            <input type="number" step="0.01" name="produkt_pris[]" placeholder="Pris" min="0" value="${pris}" required>
            <button type="button" class="remove-product-btn">Fjern</button>
        `;

        row.querySelector(".remove-product-btn").addEventListener("click", () => {
            row.remove();
            oppdaterTotal();
        });

        return row;
    }

    if (produkterContainer.children.length === 0) {
        produkterContainer.appendChild(nyProduktRad());
    }

    leggTilKnapp?.addEventListener("click", () => {
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
    }

    produkterContainer?.addEventListener("input", (e) => {
        if (e.target.matches('input[name="produkt_antall[]"], input[name="produkt_pris[]"]')) {
            oppdaterTotal();
        }
    });


    /* ===============================
       SENDER LOGIC
    =============================== */

    const senderPopup = document.getElementById("senderPopup");
    const editSenderBtn = document.getElementById("editSenderBtn");
    const cancelSenderBtn = document.getElementById("cancelSenderBtn");
    const saveSenderBtn = document.getElementById("saveSenderBtn");

    const senderFields = {
        firmanavn: document.getElementById("avsender_firmanavn"),
        orgnr: document.getElementById("avsender_orgnr"),
        adresse: document.getElementById("avsender_adresse")
    };

    const popupFields = {
        firmanavn: document.getElementById("popup_sender_firmanavn"),
        orgnr: document.getElementById("popup_sender_orgnr"),
        adresse: document.getElementById("popup_sender_adresse")
    };

    async function loadSender() {
        try {
            const res = await fetch("/get-sender");
            const data = await res.json();

            if (data.exists) {
                senderFields.firmanavn.value = data.firmanavn;
                senderFields.orgnr.value = data.orgnr;
                senderFields.adresse.value = data.adresse;
            }
        } catch (err) {
            console.error("Kunne ikke hente avsender:", err);
        }
    }

    loadSender();

    editSenderBtn?.addEventListener("click", () => {
        popupFields.firmanavn.value = senderFields.firmanavn.value;
        popupFields.orgnr.value = senderFields.orgnr.value;
        popupFields.adresse.value = senderFields.adresse.value;
        senderPopup.style.display = "flex";
    });

    cancelSenderBtn?.addEventListener("click", () => {
        senderPopup.style.display = "none";
    });

    saveSenderBtn?.addEventListener("click", async () => {

        const data = {
            firmanavn: popupFields.firmanavn.value,
            orgnr: popupFields.orgnr.value,
            adresse: popupFields.adresse.value
        };

        try {
            const res = await fetch("/save-sender", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify(data)
            });

            const result = await res.json();

            if (result.success) {
                senderFields.firmanavn.value = data.firmanavn;
                senderFields.orgnr.value = data.orgnr;
                senderFields.adresse.value = data.adresse;
                senderPopup.style.display = "none";
            }
        } catch (err) {
            console.error("Kunne ikke lagre avsender:", err);
        }
    });

});
