document.addEventListener("DOMContentLoaded", function() {
    const searchInput = document.getElementById("searchInput");
    const table = document.getElementById("kundeTable");
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

    // ===== Søkefunksjon =====
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

    // ===== Åpne popup =====
    function openPopup(kundeId, mode="edit", rowData=null) {
        currentKundeId = kundeId;

        fields.forEach(f => {
            const el = document.getElementById(f);
            const dataAttr = "data-" + f.replace("popup","").toLowerCase();
            el.value = rowData.getAttribute(dataAttr) || "";
            if(mode === "edit") el.removeAttribute("readonly");
            else el.setAttribute("readonly", true);

            originalValues[f] = el.value;
        });

        saveBtn.style.display = mode === "edit" ? "inline-block" : "none";
        saveBtn.disabled = true;
        saveBtn.classList.remove("active");

        popup.style.display = "flex";
    }

    // ===== Klikk på edit-ikon =====
    document.querySelectorAll(".edit-icon").forEach(icon => {
        icon.addEventListener("click", e => {
            e.stopPropagation();
            const row = icon.closest("tr");
            const kundeId = row.dataset.id;
            openPopup(kundeId, "edit", row);
        });
    });

    // ===== Klikk på tabellrad =====
    document.querySelectorAll("#kundeTable tbody tr").forEach(row => {
        row.addEventListener("click", e => {
            if (!e.target.classList.contains("edit-icon")) {
                const kundeId = row.dataset.id;
                openPopup(kundeId, "view", row);
            }
        });
    });

    // ===== Lukk popup =====
    closePopup.addEventListener("click", () => popup.style.display = "none");
    popup.addEventListener("click", e => { if (e.target === popup) popup.style.display = "none"; });

    // ===== Aktiver lagre-knapp =====
    fields.forEach(f => {
        const el = document.getElementById(f);
        el.addEventListener("input", () => {
            const changed = fields.some(f => document.getElementById(f).value !== originalValues[f]);
            saveBtn.disabled = !changed;
            saveBtn.classList.toggle("active", changed);
        });
    });

    // ===== Lagre-endringer =====
    saveBtn.addEventListener("click", () => {
        if (!currentKundeId) return;

        const updatedData = {};
        fields.forEach(f => {
            updatedData[f.replace("popup","").toLowerCase()] = document.getElementById(f).value;
        });

        fetch(`/update-kunde/${currentKundeId}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updatedData)
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                const row = document.querySelector(`#kundeTable tbody tr[data-id='${currentKundeId}']`);
                
                // Oppdater <tr> data-attributes
                Object.keys(updatedData).forEach(key => {
                    row.setAttribute(`data-${key}`, updatedData[key]);
                });

                // Oppdater cellene
                row.querySelectorAll("td[data-field]").forEach(td => {
                    const field = td.getAttribute("data-field");
                    if (updatedData[field] !== undefined) td.textContent = updatedData[field];
                });
            } else {
                console.error(data.message);
            }
        })
        .catch(err => console.error(err));

        popup.style.display = "none";
    });
});
