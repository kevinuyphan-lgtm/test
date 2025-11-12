document.addEventListener("DOMContentLoaded", function() {
    // 🔍 Søkefunksjon
    const searchInput = document.getElementById("searchInput");
    const table = document.getElementById("kundeTable");
    if (searchInput && table) {
        searchInput.addEventListener("keyup", function() {
            const filter = searchInput.value.toLowerCase();
            const rows = table.getElementsByTagName("tr");
            for (let i = 1; i < rows.length; i++) {
                const rowText = rows[i].innerText.toLowerCase();
                rows[i].style.display = rowText.includes(filter) ? "" : "none";
            }
        });
    }

    // ✏️ Popup-funksjon
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

    document.querySelectorAll(".edit-icon").forEach(icon => {
        icon.addEventListener("click", () => {
            currentKundeId = icon.dataset.id; // Hent kunde-id
            fields.forEach(f => {
                const el = document.getElementById(f);
                const dataAttr = "data-" + f.replace("popup", "").toLowerCase();
                el.value = icon.getAttribute(dataAttr) || "";
                originalValues[f] = el.value;
            });

            saveBtn.disabled = true;
            saveBtn.classList.remove("active");
            popup.style.display = "flex";
        });
    });

    // Lukk popup
    const closePopupFn = () => {
        popup.style.display = "none";
        currentKundeId = null;
    };

    closePopup.addEventListener("click", closePopupFn);
    popup.addEventListener("click", (e) => {
        if (e.target === popup) closePopupFn();
    });

    // Aktiver "Lagre" knappen når en verdi endres
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
        if (!currentKundeId) return;

        const updatedData = {};
        fields.forEach(f => {
            const key = f.replace("popup", "").toLowerCase(); // navn, firma osv
            updatedData[key] = document.getElementById(f).value;
        });

        fetch(`/update-kunde/${currentKundeId}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updatedData)
        })
        .then(res => res.json())
        .then(data => {
            if(data.success){
                location.reload(); // oppdater siden for å se endringer
            } else {
                console.error("Feil ved lagring:", data.message);
            }
        })
        .catch(err => console.error("Fetch error:", err));

        closePopupFn();
    });
});
