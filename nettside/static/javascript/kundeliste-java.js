document.addEventListener("DOMContentLoaded", function() {
    // ===== DOM ELEMENTER =====
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

    // ===== SØKEFUNKSJON =====
    if(searchInput && table) {
        searchInput.addEventListener("keyup", function() {
            const filter = searchInput.value.toLowerCase();
            const rows = table.querySelectorAll("tbody tr");
            rows.forEach(row => {
                const rowText = row.innerText.toLowerCase();
                row.style.display = rowText.includes(filter) ? "" : "none";
            });
        });
    }

    // ===== ÅPNE POPUP =====
    function openPopup(kundeId=null, mode="edit", rowData=null) {
        currentKundeId = kundeId;
        isNew = mode === "new";

        if(!popupTitle) return console.error("popupTitle element mangler!");
        popupTitle.textContent = isNew ? "Ny Kunde" : "Edit Kunde";

        fields.forEach(f => {
            const el = document.getElementById(f);
            if(isNew) {
                el.value = "";
            } else {
                el.value = rowData.getAttribute("data-"+f.replace("popup","").toLowerCase()) || "";
            }
            el.removeAttribute("readonly");
            originalValues[f] = el.value;
        });

        // Lagre-knapp aktiv for ny kunde, deaktivert for edit til endring
        saveBtn.disabled = !isNew;
        saveBtn.classList.toggle("active", isNew);

        popup.style.display = "flex";
    }

    // ===== CLICK: REDIGER IKON =====
    table.querySelectorAll(".edit-icon").forEach(icon => {
        icon.addEventListener("click", e => {
            e.stopPropagation();
            const row = icon.closest("tr");
            openPopup(row.dataset.id, "edit", row);
        });
    });

    // ===== CLICK: NY KUNDE KNAPP =====
    if(newKundeBtn) {
        newKundeBtn.addEventListener("click", () => openPopup(null, "new"));
    }

    // ===== LUKK POPUP =====
    closePopup.addEventListener("click", () => popup.style.display="none");
    popup.addEventListener("click", e => { if(e.target === popup) popup.style.display="none"; });

    // ===== INPUT FELT - AKTIVER LAGRE KNAPP =====
    fields.forEach(f => {
        const el = document.getElementById(f);
        el.addEventListener("input", ()=>{
            const changed = fields.some(f => document.getElementById(f).value !== originalValues[f]);
            saveBtn.disabled = !changed && !isNew;
            saveBtn.classList.toggle("active", changed || isNew);
        });
    });

    // ===== LAGRE-ENDRINGER / NY KUNDE =====
    saveBtn.addEventListener("click", ()=>{
        const payload = {};
        fields.forEach(f => payload[f.replace("popup","").toLowerCase()] = document.getElementById(f).value);
        const url = isNew ? "/add-kunde" : `/update-kunde/${currentKundeId}`;

        fetch(url,{
            method:"POST",
            headers:{"Content-Type":"application/json"},
            body:JSON.stringify(payload)
        }).then(res => res.json())
          .then(data => {
              if(!data.success){
                  alert(data.message || "Noe gikk galt");
                  return;
              }

              if(isNew){
                  // Legg til ny rad i tabellen
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

                  // Legg til event på edit-ikon
                  row.querySelector(".edit-icon").addEventListener("click", e=>{
                      openPopup(data.kunde.id,"edit",row);
                  });
              } else {
                  // Oppdater eksisterende rad
                  const row = table.querySelector(`tr[data-id='${currentKundeId}']`);
                  fields.forEach(f=>{
                      const key = f.replace("popup","").toLowerCase();
                      row.dataset[key] = data.kunde[key];
                      row.querySelector(`[data-field="${key}"]`).textContent = data.kunde[key];
                  });
              }

              popup.style.display = "none";
          })
          .catch(err => console.error(err));
    });
});
