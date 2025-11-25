// static/javascript/tjenester-java.js
document.addEventListener("DOMContentLoaded", () => {

    // --- DATO / FORFALL ---
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
        // Vis i norsk format dd.mm.yyyy
        const lokal = baseDate.toLocaleDateString("no-NO");
        displayField.value = lokal;
    }

    oppdaterForfallsDato();
    daysInput.addEventListener("input", oppdaterForfallsDato);
    invoiceDateInput.addEventListener("change", oppdaterForfallsDato);

    // --- AUTOFYLL KUNDE FRA DATALIST ---
    const firmanavnInput = document.getElementById("firmanavn");
    const adresseInput = document.getElementById("firmaadresse");
    const orgnrInput = document.getElementById("orgnr");
    const referanseInput = document.getElementById("referanse");

    const datalist = document.getElementById("kunder_list");
    // Map fra navn -> dataattr
    const kunderMap = {};
    if (datalist) {
        Array.from(datalist.options).forEach(opt => {
            const val = opt.value;
            kunderMap[val] = {
                adresse: opt.dataset.adresse || "",
                orgnr: opt.dataset.orgnr || "",
                referanse: opt.dataset.referanse || ""
            };
        });
    }

    firmanavnInput && firmanavnInput.addEventListener("input", () => {
        const v = firmanavnInput.value;
        if (kunderMap[v]) {
            adresseInput.value = kunderMap[v].adresse;
            orgnrInput.value = kunderMap[v].orgnr;
            referanseInput.value = kunderMap[v].referanse;
        } else {
            // beholde brukerinnskrevet verdi hvis ikke funnet
            // adresseInput.value = "";
            // orgnrInput.value = "";
            // referanseInput.value = "";
        }
    });

    // --- PRODUKT: legg til / fjern rader ---
    const produkterContainer = document.getElementById("produkter-container");
    const leggTilKnapp = document.querySelector(".secondary-btn");

    function nyProduktRad(navn = "", antall = 1, pris = "") {
        const row = document.createElement("div");
        row.className = "produkt-row";
        row.style.display = "flex";
        row.style.gap = "8px";
        row.style.marginBottom = "8px";
        row.style.alignItems = "center";

        // Produktnavn
        const navnInput = document.createElement("input");
        navnInput.type = "text";
        navnInput.name = "produkt_navn[]";
        navnInput.placeholder = "Produkt";
        navnInput.value = navn;
        navnInput.required = true;
        navnInput.style.flex = "1";

        // Antall
        const antallInput = document.createElement("input");
        antallInput.type = "number";
        antallInput.name = "produkt_antall[]";
        antallInput.placeholder = "Antall";
        antallInput.min = "1";
        antallInput.value = antall;
        antallInput.required = true;
        antallInput.style.width = "90px";

        // Pris
        const prisInput = document.createElement("input");
        prisInput.type = "number";
        prisInput.name = "produkt_pris[]";
        prisInput.placeholder = "Pris";
        prisInput.step = "0.01";
        prisInput.min = "0";
        prisInput.value = pris;
        prisInput.required = true;
        prisInput.style.width = "120px";

        // Fjern-knapp
        const fjernBtn = document.createElement("button");
        fjernBtn.type = "button";
        fjernBtn.className = "remove-product-btn";
        fjernBtn.textContent = "Fjern";
        fjernBtn.style.background = "#e74c3c";
        fjernBtn.style.color = "#fff";
        fjernBtn.style.border = "none";
        fjernBtn.style.padding = "6px 10px";
        fjernBtn.style.borderRadius = "6px";
        fjernBtn.style.cursor = "pointer";

        fjernBtn.addEventListener("click", () => {
            row.remove();
            // hvis du har totalsum: beregnTotal();
        });

        row.appendChild(navnInput);
        row.appendChild(antallInput);
        row.appendChild(prisInput);
        row.appendChild(fjernBtn);

        return row;
    }

    // Hvis containeren er tom (f.eks. første innlasting) — sørg for minst én rad
    if (produkterContainer && produkterContainer.children.length === 0) {
        produkterContainer.appendChild(nyProduktRad());
    } else {
        // konverter eksisterende markup til samme struktur (valgfritt)
        // Hvis du allerede har .produkt-row elementer, legger vi fjern-knapp på dem:
        Array.from(produkterContainer.querySelectorAll(".produkt-row")).forEach(r => {
            if (!r.querySelector(".remove-product-btn")) {
                const btn = document.createElement("button");
                btn.type = "button";
                btn.className = "remove-product-btn";
                btn.textContent = "Fjern";
                btn.style.marginLeft = "8px";
                btn.addEventListener("click", () => r.remove());
                r.appendChild(btn);
            }
        });
    }

    // Legg til ny rad ved klikk
    if (leggTilKnapp) {
        leggTilKnapp.addEventListener("click", () => {
            // simple anti-double: disable i 200ms
            leggTilKnapp.disabled = true;
            setTimeout(() => leggTilKnapp.disabled = false, 200);

            const sisteRad = produkterContainer.querySelector(".produkt-row:last-child");
            // Hvis siste rad er helt tom (ingen navn, pris), unngå å legge til flere
            if (sisteRad) {
                const navnVal = sisteRad.querySelector('input[name="produkt_navn[]"]')?.value.trim();
                const prisVal = sisteRad.querySelector('input[name="produkt_pris[]"]')?.value.trim();
                if (!navnVal && !prisVal) {
                    // Fokuser heller siste rad i stedet for å legge til ny
                    sisteRad.querySelector('input[name="produkt_navn[]"]')?.focus();
                    return;
                }
            }

            produkterContainer.appendChild(nyProduktRad());
            // hvis du har totalsum: beregnTotal();
        });
    }

    // --- (VALGFRI) totalsum-funksjon som du kan kalle når du trenger ---
    function beregnTotal() {
        const rader = Array.from(produkterContainer.querySelectorAll(".produkt-row"));
        let total = 0;
        rader.forEach(r => {
            const a = parseFloat(r.querySelector('input[name="produkt_antall[]"]')?.value || 0);
            const p = parseFloat(r.querySelector('input[name="produkt_pris[]"]')?.value || 0);
            total += (a * p);
        });
        // her kan du oppdatere en DOM-node med total, f.eks:
        // document.getElementById("invoice_total").textContent = total.toFixed(2);
        return total;
    }

    // Event-delegasjon: hvis noen endrer antall/pris, oppdater totalsum
    produkterContainer.addEventListener("input", (e) => {
        if (e.target.matches('input[name="produkt_antall[]"], input[name="produkt_pris[]"]')) {
            // beregnTotal(); // aktiver hvis du viser totalsum
        }
    });

});
