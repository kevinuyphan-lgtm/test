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

        popupTitle.textContent = isNew ? "Ny Kunde" : "Edit Kunde";

        fields.forEach(f => {
            const el = document.getElementById(f);
            el.value = isNew ? "" : rowData.dataset[f.replace("popup","").toLowerCase()] || "";
            el.removeAttribute("readonly");
            originalValues[f] = el.value;
        });

        saveBtn.disabled = !isNew;
        saveBtn.classList.toggle("active", isNew);
        popup.style.display = "flex";
    }

    // ===== Legg til event på edit-ikon =====
    function addEditEvents(){
        if(!table) return;
        table.querySelectorAll(".edit-icon").forEach(icon => {
            icon.removeEventListener("click", ()=>{}); // unngå dobbel binding
            icon.addEventListener("click", e=>{
                e.stopPropagation();
                const row = icon.closest("tr");
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
        el.addEventListener("input", ()=>{
            const changed = fields.some(f => document.getElementById(f).value !== originalValues[f]);
            saveBtn.disabled = !changed && !isNew;
            saveBtn.classList.toggle("active", changed || isNew);
        });
    });

    // ===== Lagre ny/endre eksisterende =====
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
                  fields.forEach(f=>{
                      const key = f.replace("popup","").toLowerCase();
                      row.dataset[key] = data.kunde[key];
                      row.querySelector(`[data-field="${key}"]`).textContent = data.kunde[key];
                  });
              }

              popup.style.display = "none";
          }).catch(err=>console.error(err));
    });
});
