document.addEventListener("DOMContentLoaded", function() {
    // 🔍 Søkefunksjon
    const searchInput = document.getElementById("searchInput");
    const table = document.getElementById("kundeTable");
    searchInput.addEventListener("keyup", function() {
        const filter = searchInput.value.toLowerCase();
        const rows = table.getElementsByTagName("tr");
        for (let i = 1; i < rows.length; i++) {
            const rowText = rows[i].innerText.toLowerCase();
            rows[i].style.display = rowText.includes(filter) ? "" : "none";
        }
    });

    // ✏️ Popup-funksjon med editable input-felt
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

    document.querySelectorAll(".edit-icon").forEach(icon => {
        icon.addEventListener("click", () => {
            // Sett input-feltene og lagre originalverdier
            fields.forEach(f => {
                const el = document.getElementById(f);
                const dataAttr = "data-" + f.replace("popup", "").toLowerCase();
                el.value = icon.getAttribute(dataAttr);
                originalValues[f] = el.value;
            });

            saveBtn.disabled = true;
            saveBtn.classList.remove("active");
            popup.style.display = "flex";
        });
    });

    // Lukk popup
    closePopup.addEventListener("click", () => popup.style.display = "none");
    popup.addEventListener("click", (e) => {
        if (e.target === popup) popup.style.display = "none";
    });

    // Aktiver "Lagre" knappen når en verdi endres
    fields.forEach(f => {
        const el = document.getElementById(f);
        el.addEventListener("input", () => {
            const changed = fields.some(f => document.getElementById(f).value !== originalValues[f]);
            saveBtn.disabled = !changed;
            if (changed) {
                saveBtn.classList.add("active");
            } else {
                saveBtn.classList.remove("active");
            }
        });
    });

    // TODO: Legg til AJAX / POST for å sende data til backend
    saveBtn.addEventListener("click", () => {
        const updatedData = {};
        fields.forEach(f => {
            updatedData[f] = document.getElementById(f).value;
        });
        console.log("Oppdaterte data:", updatedData);
        // Her kan du gjøre en fetch/post til Flask for å lagre endringene
        popup.style.display = "none";
    });
});
