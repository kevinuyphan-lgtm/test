document.addEventListener("DOMContentLoaded", function() {
    const searchInput = document.getElementById("searchInput");
    let table = document.getElementById("kundeTable");
    const tableCard = document.getElementById("tableCard");
    const popup = document.getElementById("popup");
    const closePopup = document.getElementById("closePopup");
    const saveBtn = document.getElementById("saveChanges");
    const newKundeBtn = document.getElementById("newKundeBtn");
    const popupTitle = document.getElementById("popupTitle");
    const noData = document.getElementById("noData");

    const fields = [
        "popupNavn","popupFirma","popupAdresse","popupOrgnr",
        "popupReferanse","popupTelefon","popupEpost"
    ];

    let originalValues = {};
    let currentKundeId = null;
    let isNew = false;

    // ===== Søkefunksjon =====
    if(searchInput && table){
        searchInput.addEventListener("keyup", function(){
            const filter = searchInput.value.toLowerCase();
            table.querySelectorAll("tbody tr").forEach(row => {
                row.style.display = row.innerText.toLowerCase().includes(filter) ? "" : "none";
            });
        });
    }

    // ===== Åpne popup =====
    function openPopup(kundeId=null, mode="edit", rowData=null){
        currentKundeId = kundeId;
        isNew = mode === "new";

        console.log("DEBUG openPopup", {kundeId, mode, rowData}); // DEBUG

        popupTitle.textContent = isNew ? "Ny Kunde" : "Endre Kunde";

        fields.forEach(f => {
            const el = document.getElementById(f);
            let key = f.replace("popup","").toLowerCase();
            el.value = isNew ? "" : (rowData.dataset[key] || "");
            el.removeAttribute("readonly");
            originalValues[f] = el.value;
        });

        updateSaveButton();
        popup.style.display = "flex";
    }

    function updateSaveButton(){
        const allFilled = fields.every(f => document.getElementById(f).value.trim() !== "");
        const changed = fields.some(f => {
            const elVal = document.getElementById(f).value.trim();
            const origVal = originalValues[f] ? originalValues[f].trim() : "";
            return elVal !== origVal;
        });
        saveBtn.disabled = !(allFilled && (isNew || changed));
        saveBtn.classList.toggle("active", allFilled && (isNew || changed));
    }

    // ===== Legg til event på edit-ikon =====
    function addEditEvents(){
        if(!table) return;
        table.querySelectorAll(".edit-icon").forEach(icon => {
            icon.onclick = null; // unngå dobbel binding
            icon.addEventListener("click", e=>{
                e.stopPropagation();
                const row = icon.closest("tr");
                console.log("DEBUG clicked edit", row.dataset); // DEBUG
                openPopup(row.dataset.id, "edit", row);
            });
        });
    }

    addEditEvents();

    // ===== Ny kunde knapp =====
    if(newKundeBtn){
        newKundeBtn.addEventListener("click", ()=> openPopup(null, "new"));
    }

    // ===== Lukk popup =====
    closePopup.addEventListener("click", ()=> popup.style.display="none");
    popup.addEventListener("click", e=>{ if(e.target === popup) popup.style.display="none"; });

    // ===== Input felter =====
    fields.forEach(f => {
        const el = document.getElementById(f);
        el.addEventListener("input", updateSaveButton);
    });

    // ===== Lagre ny/endre eksisterende =====
    saveBtn.addEventListener("click", ()=>{
        if(saveBtn.disabled) return;

        const payload = {};
        fields.forEach(f => payload[f.replace("popup","").toLowerCase()] = document.getElementById(f).value.trim());

        const url = isNew ? "/add-kunde" : `/update-kunde/${currentKundeId}`;

        console.log("DEBUG save click", {url, payload, currentKundeId, isNew}); // DEBUG

        fetch(url,{
            method:"POST",
            headers:{"Content-Type":"application/json"},
            body:JSON.stringify(payload),
            credentials: "same-origin"
        })
        .then(res => {
            console.log("DEBUG response", res); // DEBUG
            return res.json().catch(err => {
                console.error("DEBUG JSON parse error", err);
                throw new Error("Kan ikke parse JSON fra server");
            });
        })
        .then(data => {
            console.log("DEBUG fetch data", data); // DEBUG

            if(!data.success){
                alert(data.message || "Noe gikk galt");
                return;
            }

            // Opprett tabell hvis den ikke finnes
            if(isNew && !table){
                if(noData) noData.remove();
                tableCard.innerHTML = `
                    <table class="data-table" id="kundeTable">
                        <thead>
                            <tr>
                                <th>Navn</th>
                                <th>Adresse</th>
                                <th>Org.nr</th>
                                <th>Referanse</th>
                                <th>Handling</th>
                            </tr>
                        </thead>
                        <tbody></tbody>
                    </table>`;
                table = document.getElementById("kundeTable");
            }

            if(isNew){
                const tbody = table.querySelector("tbody");
                const row = document.createElement("tr");
                row.dataset.id = data.kunde.id;
                Object.keys(data.kunde).forEach(k => row.dataset[k] = data.kunde[k] || "");
                row.innerHTML = `
                    <td data-field="navn">${data.kunde.navn}</td>
                    <td data-field="adresse">${data.kunde.adresse}</td>
                    <td data-field="orgnr">${data.kunde.orgnr}</td>
                    <td data-field="referanse">${data.kunde.referanse}</td>
                    <td style="text-align:center;">
                        <img src="/static/bilder/edit.jpeg" class="edit-icon" style="width:32px;height:32px;cursor:pointer;">
                    </td>`;
                tbody.appendChild(row);
                addEditEvents();
            } else {
                const row = table.querySelector(`tr[data-id='${currentKundeId}']`);
                if(!row) console.warn("DEBUG: Ingen rad funnet med ID", currentKundeId); // DEBUG
                fields.forEach(f=>{
                    const key = f.replace("popup","").toLowerCase();
                    row.dataset[key] = data.kunde[key];
                    row.querySelector(`[data-field="${key}"]`).textContent = data.kunde[key];
                });
            }

            popup.style.display = "none";
        })
        .catch(err=>{
            console.error("DEBUG fetch error:", err);
            alert("Noe gikk galt under lagring. Sjekk console for detaljer.");
        });
    });
});
