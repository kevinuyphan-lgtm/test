document.addEventListener("DOMContentLoaded", function() {
    const popup = document.getElementById("popup");
    const closePopup = document.getElementById("closePopup");
    const saveBtn = document.getElementById("saveChanges");
    const fields = [
        "popupNavn",
        "popupFirma",
        "popupAdresse",
        "popupOrgnr",
        "popupReferanse",
        "popupTelefon",
        "popupEpost"
    ];

    let originalValues = {};
    let currentKundeId = null;

    // Funksjon for å åpne popup (edit eller readonly)
    function openPopup(data, readonly = false) {
        fields.forEach(f => {
            const el = document.getElementById(f);
            const key = f.replace("popup", "").toLowerCase();
            el.value = data[key] || "";
            el.readOnly = readonly;
            originalValues[f] = el.value;
        });

        saveBtn.disabled = readonly;
        saveBtn.classList.toggle("active", !readonly);
        popup.style.display = "flex";
    }

    // 🔹 Rediger-knapp
    document.querySelectorAll(".edit-icon").forEach(icon => {
        icon.addEventListener("click", (e) => {
            e.stopPropagation(); // forhindrer at row click trigger readonly
            currentKundeId = icon.dataset.id;

            const data = {
                navn: icon.dataset.navn,
                firma: icon.dataset.firma,
                adresse: icon.dataset.adresse,
                orgnr: icon.dataset.orgnr,
                referanse: icon.dataset.referanse,
                telefon: icon.dataset.telefon,
                epost: icon.dataset.epost
            };

            openPopup(data, false); // ikke readonly
        });
    });

    // 🔹 Klikk på raden (bortsett fra edit)
    document.querySelectorAll("#kundeTable tbody tr").forEach(row => {
        row.addEventListener("click", (e) => {
            if(e.target.classList.contains("edit-icon")) return; // ignorér edit-knapp

            const icon = row.querySelector(".edit-icon");
            const data = {
                navn: icon.dataset.navn,
                firma: icon.dataset.firma,
                adresse: icon.dataset.adresse,
                orgnr: icon.dataset.orgnr,
                referanse: icon.dataset.referanse,
                telefon: icon.dataset.telefon,
                epost: icon.dataset.epost
            };

            openPopup(data, true); // readonly
        });
    });

    // Lukk popup
    closePopup.addEventListener("click", () => popup.style.display = "none");
    popup.addEventListener("click", (e) => {
        if (e.target === popup) popup.style.display = "none";
    });

    // Aktiver lagre-knapp når input endres (bare for edit)
    fields.forEach(f => {
        const el = document.getElementById(f);
        el.addEventListener("input", () => {
            const changed = fields.some(f => document.getElementById(f).value !== originalValues[f]);
            saveBtn.disabled = !changed;
            saveBtn.classList.toggle("active", changed);
        });
    });

    // Lagre endringer
    saveBtn.addEventListener("click", () => {
        if(!currentKundeId) return;

        const updatedData = {
            navn: document.getElementById("popupNavn").value,
            firma: document.getElementById("popupFirma").value,
            adresse: document.getElementById("popupAdresse").value,
            orgnr: document.getElementById("popupOrgnr").value,
            referanse: document.getElementById("popupReferanse").value,
            telefon: document.getElementById("popupTelefon").value,
            epost: document.getElementById("popupEpost").value
        };

        fetch(`/update-kunde/${currentKundeId}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updatedData)
        })
        .then(res => res.json())
        .then(data => {
            if(data.success){
                // Oppdater tabell dynamisk
                const row = document.querySelector(`.edit-icon[data-id='${currentKundeId}']`).closest("tr");
                row.children[0].innerText = data.kunde.navn;
                row.children[1].innerText = data.kunde.adresse;
                row.children[2].innerText = data.kunde.orgnr;
                row.children[3].innerText = data.kunde.referanse;

                const icon = row.querySelector(".edit-icon");
                Object.keys(data.kunde).forEach(key => {
                    icon.dataset[key] = data.kunde[key];
                });

                popup.style.display = "none";
            } else {
                console.error(data.message);
            }
        })
        .catch(err => console.error(err));
    });
});
