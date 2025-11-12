document.addEventListener("DOMContentLoaded", () => {
    const searchInput = document.getElementById("searchInput");
    const tableCard = document.getElementById("tableCard");
    let table = document.getElementById("kundeTable");
    const popup = document.getElementById("popup");
    const closePopup = document.getElementById("closePopup");
    const saveBtn = document.getElementById("saveChanges");
    const newKundeBtn = document.getElementById("newKundeBtn");
    const popupTitle = document.getElementById("popupTitle");
    const noData = document.getElementById("noData");

    const deletePopup = document.getElementById("deletePopup");
    const deleteConfirmBtn = document.getElementById("confirmDelete");
    const deleteCancelBtn = document.getElementById("cancelDelete");
    let kundeToDeleteId = null;

    const fields = ["popupNavn","popupFirma","popupAdresse","popupOrgnr","popupReferanse","popupTelefon","popupEpost"];
    let originalValues = {};
    let currentKundeId = null;
    let isNew = false;

    // --- Søk ---
    searchInput?.addEventListener("keyup", () => {
        const filter = searchInput.value.toLowerCase();
        table?.querySelectorAll("tbody tr").forEach(row => {
            row.style.display = row.innerText.toLowerCase().includes(filter) ? "" : "none";
        });
    });

    // --- Åpne popup ---
    function openPopup(kundeId=null, mode="new", rowData=null){
        currentKundeId = kundeId;
        isNew = mode === "new";
        popupTitle.textContent = isNew ? "Ny Kunde" : "Endre Kunde";

        fields.forEach(f => {
            const el = document.getElementById(f);
            const key = f.replace("popup","").toLowerCase();
            el.value = isNew ? "" : (rowData?.dataset[key] || "");
            originalValues[f] = el.value;
        });

        updateSaveButton();
        popup.style.display = "flex";
    }

    function updateSaveButton(){
        const allFilled = fields.every(f => document.getElementById(f).value.trim() !== "");
        const changed = fields.some(f => document.getElementById(f).value.trim() !== (originalValues[f]||"").trim());
        saveBtn.disabled = !(allFilled && (isNew || changed));
        saveBtn.classList.toggle("active", allFilled && (isNew || changed));
    }

    fields.forEach(f => document.getElementById(f).addEventListener("input", updateSaveButton));

    // --- Legg til edit/delete events på rad ---
    function addRowEvents(row){
        const editIcon = row.querySelector(".edit-icon");
        const deleteIcon = row.querySelector(".delete-icon");

        editIcon?.addEventListener("click", e => {
            e.stopPropagation();
            openPopup(row.dataset.id, "edit", row);
        });

        deleteIcon?.addEventListener("click", e => {
            e.stopPropagation();
            kundeToDeleteId = row.dataset.id;
            deletePopup.style.display = "flex";
        });
    }

    // --- Ny kunde knapp ---
    newKundeBtn?.addEventListener("click", () => openPopup());

    // --- Lukk popup ---
    closePopup.addEventListener("click", ()=> popup.style.display="none");
    popup.addEventListener("click", e => { if(e.target===popup) popup.style.display="none"; });
    deleteCancelBtn.addEventListener("click", ()=> deletePopup.style.display="none");
    deletePopup.addEventListener("click", e => { if(e.target===deletePopup) deletePopup.style.display="none"; });

    // --- Lagre ---
    saveBtn.addEventListener("click", ()=>{
        if(saveBtn.disabled) return;

        const payload = {};
        fields.forEach(f => payload[f.replace("popup","").toLowerCase()] = document.getElementById(f).value.trim());
        const url = isNew ? "/add-kunde" : `/update-kunde/${currentKundeId}`;

        fetch(url,{
            method:"POST",
            headers:{"Content-Type":"application/json"},
            body: JSON.stringify(payload),
            credentials:"same-origin"
        })
        .then(res => res.json())
        .then(data => {
            if(!data.success) return alert(data.message || "Noe gikk galt");

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

            const tbody = table.querySelector("tbody");
            if(isNew){
                const row = document.createElement("tr");
                row.dataset.id = data.kunde.id;
                Object.keys(data.kunde).forEach(k => row.dataset[k] = data.kunde[k]||"");
                row.innerHTML = `
                    <td data-field="navn">${data.kunde.navn||""}</td>
                    <td data-field="adresse">${data.kunde.adresse||""}</td>
                    <td data-field="orgnr">${data.kunde.orgnr||""}</td>
                    <td data-field="referanse">${data.kunde.referanse||""}</td>
                    <td class="action-cell">
                        <img src="/static/bilder/edit.jpeg" class="edit-icon">
                        <img src="/static/bilder/delete.png" class="delete-icon">
                    </td>`;
                tbody.appendChild(row);
                addRowEvents(row); // ✅ Legger til event listeners direkte
            } else {
                const row = table.querySelector(`tr[data-id='${currentKundeId}']`);
                if(row){
                    fields.forEach(f=>{
                        const key = f.replace("popup","").toLowerCase();
                        row.dataset[key] = data.kunde[key]||"";
                        const cell = row.querySelector(`[data-field="${key}"]`);
                        if(cell) cell.textContent = data.kunde[key]||"";
                    });
                }
            }

            popup.style.display = "none";
        })
        .catch(err => { console.error(err); alert("Noe gikk galt under lagring."); });
    });

    // --- Slett ---
    deleteConfirmBtn.addEventListener("click", ()=>{
        if(!kundeToDeleteId) return;
        fetch(`/delete-kunde/${kundeToDeleteId}`, {method:"POST", credentials:"same-origin"})
        .then(res => res.json())
        .then(data => {
            if(data.success){
                table.querySelector(`tr[data-id='${kundeToDeleteId}']`)?.remove();
                deletePopup.style.display = "none";
                kundeToDeleteId = null;
            } else alert(data.message || "Noe gikk galt ved sletting");
        })
        .catch(err => { console.error(err); alert("Noe gikk galt ved sletting."); });
    });

    // --- Legg events på eksisterende rader ---
    table?.querySelectorAll("tbody tr").forEach(addRowEvents);
});
