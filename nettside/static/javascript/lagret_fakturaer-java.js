document.addEventListener("DOMContentLoaded", function () {

  const tableBody = document.getElementById("invoiceTableBody");
  const sendBtn = document.getElementById("sendSelected");
  const downloadBtn = document.getElementById("downloadSelected");
  const selectAll = document.getElementById("selectAll");

  const modal = document.getElementById("sendModal");
  const cancelSend = document.getElementById("cancelSend");
  const confirmSend = document.getElementById("confirmSend");
  const addEmail = document.getElementById("addEmail");
  const emailContainer = document.getElementById("emailContainer");

  const searchInput = document.getElementById("searchInput");
  const sortSelect = document.getElementById("sortSelect");

  /* ===============================
     CHECKBOX HANDLING
  =============================== */

  function getCheckboxes() {
    return Array.from(document.querySelectorAll(".invoice-checkbox"));
  }

  function getSelected() {
    return getCheckboxes().filter(cb => cb.checked);
  }

  function updateActionButtons() {
    const anyChecked = getSelected().length > 0;
    sendBtn.disabled = !anyChecked;
    downloadBtn.disabled = !anyChecked;
  }

  // Individual checkbox change
  document.addEventListener("change", function (e) {
    if (e.target.classList.contains("invoice-checkbox")) {
      updateActionButtons();
    }
  });

  // Select all
  if (selectAll) {
    selectAll.addEventListener("change", function () {
      getCheckboxes().forEach(cb => cb.checked = selectAll.checked);
      updateActionButtons();
    });
  }

  updateActionButtons();


  /* ===============================
     DOWNLOAD SELECTED
  =============================== */

  downloadBtn.addEventListener("click", function () {
    const selected = getSelected().map(cb => cb.value);
    if (!selected.length) return;

    // Redirect to backend route (lag ZIP eller bulk download der)
    window.location.href = "/bulk-download?ids=" + selected.join(",");
  });


  /* ===============================
     OPEN SEND MODAL
  =============================== */

  sendBtn.addEventListener("click", function () {
    if (sendBtn.disabled) return;

    emailContainer.innerHTML = `
      <div class="email-field">
        <input type="email" class="email-input" placeholder="Skriv inn e-post">
      </div>
    `;

    confirmSend.disabled = true;
    modal.style.display = "flex";
  });

  cancelSend.addEventListener("click", function () {
    modal.style.display = "none";
  });


  /* ===============================
     ADD EMAIL FIELD
  =============================== */

  addEmail.addEventListener("click", function () {
    const div = document.createElement("div");
    div.classList.add("email-field");
    div.innerHTML = `<input type="email" class="email-input" placeholder="Skriv inn e-post">`;
    emailContainer.appendChild(div);
  });


  /* ===============================
     VALIDATE EMAIL INPUTS
  =============================== */

  emailContainer.addEventListener("input", function () {
    const inputs = emailContainer.querySelectorAll(".email-input");
    const allFilled = Array.from(inputs).every(i => i.value.trim() !== "");
    confirmSend.disabled = !allFilled || inputs.length === 0;
  });


  /* ===============================
     SEND VIA AJAX
  =============================== */

  confirmSend.addEventListener("click", function () {

    const emails = Array.from(emailContainer.querySelectorAll(".email-input"))
      .map(i => i.value.trim());

    const selected = getSelected().map(cb => cb.value);

    fetch("/send-faktura-ajax", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        faktura_ids: selected,
        emails: emails
      })
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        modal.style.display = "none";
        alert("Faktura(er) sendt!");
        location.reload();
      } else {
        alert("Noe gikk galt ved sending.");
      }
    })
    .catch(() => {
      alert("Serverfeil.");
    });
  });


  /* ===============================
     SEARCH FUNCTION
  =============================== */

  searchInput.addEventListener("input", function () {
    const filter = searchInput.value.toLowerCase();

    Array.from(tableBody.querySelectorAll("tr")).forEach(row => {
      const text = row.innerText.toLowerCase();
      row.style.display = text.includes(filter) ? "" : "none";
    });
  });


  /* ===============================
     SORT FUNCTION
  =============================== */

  sortSelect.addEventListener("change", function () {

    const rows = Array.from(tableBody.querySelectorAll("tr"));
    const val = sortSelect.value;

    rows.sort((a, b) => {

      const aDato = new Date(a.dataset.dato || 0);
      const bDato = new Date(b.dataset.dato || 0);

      const aNavn = (a.dataset.navn || "").toLowerCase();
      const bNavn = (b.dataset.navn || "").toLowerCase();

      if (val.includes("dato")) {
        return val === "dato_desc"
          ? bDato - aDato
          : aDato - bDato;
      } else {
        return val === "navn_asc"
          ? aNavn.localeCompare(bNavn)
          : bNavn.localeCompare(aNavn);
      }
    });

    rows.forEach(row => tableBody.appendChild(row));
  });

});
