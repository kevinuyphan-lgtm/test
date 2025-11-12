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

    const deletePopup = document.getElementById("deletePopup"); // Ny popup for sletting
    const deleteConfirmBtn = document.getElementById("deleteConfirm");
    const deleteCancelBtn = document.getElementById("deleteCancel");
    let kundeToDeleteId = null;

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

        console.log("DEBUG openPopup", {kundeId, mode, rowData});

        popupTitle.textContent = isNew ? "Ny Kunde" : "Endre Kunde";

        fields.forEach(f => {
            const el = document.getElementById(f);
            let key = f.replace("popup","").toLowerCase();
            el.value = isNew ? "" : (rowData?.dataset[key] || "");
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

    // ===== Legg til event på edit-ikon og slett-ikon =====
    function addEditEvents(){
        if(!table) return;
        table.querySelectorAll("tr").forEach(row => {
            const editIcon = row.querySelector(".edit-icon");
            const deleteIcon = row.querySelector(".delete-icon");

            if(editIcon){
                editIcon.onclick = null;
                editIcon.addEventListener("click", e=>{
                    e.stopPropagation();
                    console.log("DEBUG clicked edit", row.dataset);
                    openPopup(row.dataset.id, "edit", row);
                });
            }

            if(deleteIcon){
                deleteIcon.onclick = null;
                deleteIcon.addEventListener("click", e=>{
                    e.stopPropagation();
                    kundeToDeleteId = row.dataset.id;
                    deletePopup.style.display = "flex";
                });
            }
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
    deleteCancelBtn.addEventListener("click", ()=> deletePopup.style.display="none");
    deletePopup.addEventListener("click", e=>{ if(e.target === deletePopup) deletePopup.style.display="none"; });

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

        console.log("DEBUG save click", {url, payload, currentKundeId, isNew});

        fetch(url,{
            method:"POST",
            headers:{"Content-Type":"application/json"},
            body:JSON.stringify(payload),
            credentials: "same-origin"
        })
        .then(res => res.json())
        .then(data => {
            console.log("DEBUG fetch data", data);

            if(!data.success){
                alert(data.message || "Noe gikk galt");
                return;
            }

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
                Object.keys(data.kunde).forEach(k => row.dataset[k] = data.kunde[k] || "");
                row.innerHTML = `
                    <td data-field="navn">${data.kunde.navn || ""}</td>
                    <td data-field="adresse">${data.kunde.adresse || ""}</td>
                    <td data-field="orgnr">${data.kunde.orgnr || ""}</td>
                    <td data-field="referanse">${data.kunde.referanse || ""}</td>
                    <td style="text-align:center;">
                        <img src="/static/bilder/edit.jpeg" class="edit-icon" style="width:32px;height:32px;cursor:pointer;">
                        <img src="/static/bilder/delete.jpeg" class="delete-icon" style="width:32px;height:32px;cursor:pointer;margin-left:8px;">
                    </td>`;
                tbody.appendChild(row);
            } else {
                const row = table.querySelector(`tr[data-id='${currentKundeId}']`);
                if(row){
                    fields.forEach(f=>{
                        const key = f.replace("popup","").toLowerCase();
                        const val = data.kunde[key] || "";
                        row.dataset[key] = val;
                        const cell = row.querySelector(`[data-field="${key}"]`);
                        if(cell) cell.textContent = val;
                    });
                }
            }

            addEditEvents();
            popup.style.display = "none";
        })
        .catch(err=>{
            console.error("DEBUG fetch error:", err);
            alert("Noe gikk galt under lagring. Sjekk console for detaljer.");
        });
    });

    // ===== Slett kunde =====
    deleteConfirmBtn.addEventListener("click", ()=>{
        if(!kundeToDeleteId) return;

        fetch(`/delete-kunde/${kundeToDeleteId}`, {
            method: "POST",
            credentials: "same-origin"
        })
        .then(res => res.json())
        .then(data => {
            if(data.success){
                const row = table.querySelector(`tr[data-id='${kundeToDeleteId}']`);
                if(row) row.remove();
                deletePopup.style.display = "none";
                kundeToDeleteId = null;
            } else {
                alert(data.message || "Noe gikk galt ved sletting");
            }
        })
        .catch(err=>{
            console.error("DEBUG delete error:", err);
            alert("Noe gikk galt ved sletting. Sjekk console for detaljer.");
        });
    });
});
