document.addEventListener("DOMContentLoaded", () => {

  /* ======================================
     DATO SYNK (2-veis system)
  ====================================== */

  const invoiceDateInput = document.getElementById("invoice_date");
  const daysInput = document.getElementById("forfalls_dager");
  const dueDateDisplay = document.getElementById("due_date_display");
  const hiddenDueDate = document.getElementById("due_date");

  if (invoiceDateInput && daysInput && dueDateDisplay && hiddenDueDate) {

    const today = new Date();
    invoiceDateInput.value = today.toISOString().split("T")[0];

    function formatDisplay(date) {
      const d = String(date.getDate()).padStart(2, "0");
      const m = String(date.getMonth() + 1).padStart(2, "0");
      const y = date.getFullYear();
      return `${d}/${m}/${y}`;
    }

    function parseDisplay(str) {
      const parts = str.split("/");
      if (parts.length !== 3) return null;

      const [d, m, y] = parts.map(Number);
      if (!d || !m || !y) return null;

      return new Date(y, m - 1, d);
    }

    function updateFromDays() {
      const base = new Date(invoiceDateInput.value);
      const days = parseInt(daysInput.value) || 0;
      base.setDate(base.getDate() + days);

      hiddenDueDate.value = base.toISOString().split("T")[0];
      dueDateDisplay.value = formatDisplay(base);
    }

    function updateFromDueDate() {
      const base = new Date(invoiceDateInput.value);
      const due = parseDisplay(dueDateDisplay.value);
      if (!due) return;

      hiddenDueDate.value = due.toISOString().split("T")[0];

      const diff = Math.round((due - base) / (1000 * 60 * 60 * 24));
      daysInput.value = diff >= 0 ? diff : 0;
    }

    function updateFromInvoiceDate() {
      updateFromDays();
    }

    updateFromDays();

    daysInput.addEventListener("input", updateFromDays);
    invoiceDateInput.addEventListener("change", updateFromInvoiceDate);
    dueDateDisplay.addEventListener("input", updateFromDueDate);
  }


  /* ===============================
     AUTOFYLL KUNDE (FIXED)
  =============================== */

  const firmanavnInput = document.getElementById("firmanavn");
  const adresseInput = document.getElementById("firmaadresse");
  const orgnrInput = document.getElementById("orgnr");
  const referanseInput = document.getElementById("referanse");
  const datalist = document.getElementById("kunder_list");

  if (firmanavnInput && datalist) {

    function fillCustomerData(selectedName) {

      const options = Array.from(datalist.options);
      const match = options.find(opt => opt.value === selectedName);

      if (match) {
        adresseInput.value = match.dataset.adresse || "";
        orgnrInput.value = match.dataset.orgnr || "";
        referanseInput.value = match.dataset.referanse || "";
      }
    }

    firmanavnInput.addEventListener("change", () => {
      fillCustomerData(firmanavnInput.value);
    });

    firmanavnInput.addEventListener("input", () => {
      fillCustomerData(firmanavnInput.value);
    });
  }


  /* ===============================
     PRODUKTER
  =============================== */

  const produkterContainer = document.getElementById("produkter-container");
  const addProductBtn = document.getElementById("addProductBtn");

  function createProductRow() {

    const row = document.createElement("div");
    row.className = "produkt-row product-card";

    row.innerHTML = `
      <input type="text" name="produkt_navn[]" placeholder="Produkt" required>
      <input type="number" name="produkt_antall[]" placeholder="Antall" min="1" required>
      <input type="number" name="produkt_pris[]" placeholder="Pris" step="0.01" min="0" required>
      <button type="button" class="remove-product-btn">Fjern</button>
    `;

    row.querySelector(".remove-product-btn").addEventListener("click", () => {
      row.remove();
    });

    return row;
  }

  if (produkterContainer) {

    // Bare legg til hvis tom
    if (produkterContainer.children.length === 0) {
      produkterContainer.appendChild(createProductRow());
    }

    addProductBtn?.addEventListener("click", () => {
      produkterContainer.appendChild(createProductRow());
    });
  }


  /* ===============================
     SENDER LOGIC
  =============================== */

  const senderPopup = document.getElementById("senderPopup");
  const editSenderBtn = document.getElementById("editSenderBtn");
  const cancelSenderBtn = document.getElementById("cancelSenderBtn");
  const saveSenderBtn = document.getElementById("saveSenderBtn");

  const senderFields = {
    firmanavn: document.getElementById("avsender_firmanavn"),
    orgnr: document.getElementById("avsender_orgnr"),
    adresse: document.getElementById("avsender_adresse")
  };

  const popupFields = {
    firmanavn: document.getElementById("popup_sender_firmanavn"),
    orgnr: document.getElementById("popup_sender_orgnr"),
    adresse: document.getElementById("popup_sender_adresse")
  };

  async function loadSender() {
    try {
      const res = await fetch("/get-sender");
      const data = await res.json();

      if (data.exists) {
        senderFields.firmanavn.value = data.firmanavn;
        senderFields.orgnr.value = data.orgnr;
        senderFields.adresse.value = data.adresse;
      }
    } catch (err) {
      console.error("Kunne ikke hente avsender:", err);
    }
  }

  loadSender();

  editSenderBtn?.addEventListener("click", () => {
    popupFields.firmanavn.value = senderFields.firmanavn.value;
    popupFields.orgnr.value = senderFields.orgnr.value;
    popupFields.adresse.value = senderFields.adresse.value;
    senderPopup.style.display = "flex";
  });

  cancelSenderBtn?.addEventListener("click", () => {
    senderPopup.style.display = "none";
  });

  saveSenderBtn?.addEventListener("click", async () => {

    const data = {
      firmanavn: popupFields.firmanavn.value,
      orgnr: popupFields.orgnr.value,
      adresse: popupFields.adresse.value
    };

    try {
      const res = await fetch("/save-sender", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });

      const result = await res.json();

      if (result.success) {
        senderFields.firmanavn.value = data.firmanavn;
        senderFields.orgnr.value = data.orgnr;
        senderFields.adresse.value = data.adresse;
        senderPopup.style.display = "none";
      }
    } catch (err) {
      console.error("Kunne ikke lagre sender:", err);
    }
  });

});
