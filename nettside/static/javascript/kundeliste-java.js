document.addEventListener("DOMContentLoaded", function() {
    const searchInput = document.getElementById("searchInput");
    const table = document.getElementById("kundeTable");
    const popup = document.getElementById("popup");
    const closePopup = document.getElementById("closePopup");
    const saveBtn = document.getElementById("saveChanges");
    const newKundeBtn = document.getElementById("newKundeBtn");
    const popupTitle = document.getElementById("popupTitle");

    const fields = [
        "popupNavn","popupFirma","popupAdresse","popupOrgnr",
        "popupReferanse","popupTelefon","popupEpost"
    ];

    let originalValues = {};
    let currentKundeId = null;
    let isNew = false;

    // Søk
    if(searchInput && table) {
        searchInput.addEventListener("keyup", function() {
            const filter = searchInput.value.toLowerCase();
            const rows = table.getElementsByTagName("tr");
            for(let i=1;i<rows.length;i++){
                const rowText = rows[i].innerText.toLowerCase();
                rows[i].style.display = rowText.includes(filter) ? "" : "none";
            }
        });
    }

    function openPopup(kundeId=null, mode="edit", rowData=null) {
        currentKundeId = kundeId;
        isNew = mode==="new";
        popupTitle.textContent = isNew ? "Ny Kunde" : "Edit Kunde";

        fields.forEach(f => {
            const el = document.getElementById(f);
            el.value = isNew ? "" : rowData.getAttribute("data-"+f.replace("popup","").toLowerCase()) || "";
            el.removeAttribute("readonly");
            originalValues[f] = el.value;
        });

        saveBtn.disabled = true;
        saveBtn.classList.remove("active");
        popup.style.display = "flex";
    }

    document.querySelectorAll(".edit-icon").forEach(icon => {
        icon.addEventListener("click", e => {
            e.stopPropagation();
            openPopup(icon.closest("tr").dataset.id, "edit", icon.closest("tr"));
        });
    });

    newKundeBtn.addEventListener("click", () => openPopup(null, "new"));

    closePopup.addEventListener("click", () => popup.style.display="none");
    popup.addEventListener("click", e => { if(e.target===popup) popup.style.display="none"; });

    fields.forEach(f => {
        document.getElementById(f).addEventListener("input", ()=>{
            const changed = fields.some(f => document.getElementById(f).value !== originalValues[f]);
            saveBtn.disabled = !changed;
            saveBtn.classList.toggle("active", changed);
        });
    });

    saveBtn.addEventListener("click", ()=>{
        const payload = {};
        fields.forEach(f => payload[f.replace("popup","").toLowerCase()] = document.getElementById(f).value);
        const url = isNew ? "/add-kunde" : `/update-kunde/${currentKundeId}`;

        fetch(url,{
            method:"POST",
            headers:{"Content-Type":"application/json"},
            body:JSON.stringify(payload)
        }).then(res=>res.json()).then(data=>{
            if(!data.success){ alert(data.message || "Noe gikk galt"); return; }

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
                        <img src="/static/bilder/edit.jpeg" class="edit-icon" style="width:32px;height:32px;">
                    </td>`;
                tbody.appendChild(row);
                row.querySelector(".edit-icon").addEventListener("click", e=>{
                    openPopup(data.kunde.id,"edit",row);
                });
            } else {
                const row = table.querySelector(`tr[data-id='${currentKundeId}']`);
                fields.forEach(f=>{
                    const key = f.replace("popup","").toLowerCase();
                    row.dataset[key] = data.kunde[key];
                    row.querySelector(`[data-field="${key}"]`).textContent = data.kunde[key];
                });
            }
        }).catch(err=>console.error(err));

        popup.style.display="none";
    });
});
