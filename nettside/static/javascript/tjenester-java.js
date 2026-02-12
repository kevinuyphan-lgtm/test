document.addEventListener("DOMContentLoaded", () => {

  /* ===============================
     DATO / FORFALL
  =============================== */
  const invoiceDateInput = document.getElementById("invoice_date");
  const daysInput = document.getElementById("forfalls_dager");
  const displayField = document.getElementById("due_date_display");
  const hiddenField = document.getElementById("due_date");

  if (invoiceDateInput && daysInput && displayField && hiddenField) {

    const today = new Date();
    invoiceDateInput.value = today.toISOString().split("T")[0];

    function oppdaterForfallsDato() {
      const baseDate = new Date(invoiceDateInput.value);
      const days = parseInt(daysInput.value) || 7;
      baseDate.setDate(baseDate.getDate() + days);

      hiddenField.value = baseDate.toISOString().split("T")[0];
      displayField.value = baseDate.toLocaleDateString("no-NO");
    }

    oppdaterForfallsDato();
    daysInput.addEventListener("input", oppdaterForfallsDato);
    invoiceDateInput.addEventListener("change", oppdaterForfallsDato);
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
    produkterContainer.appendChild(createProductRow());
  }

  addProductBtn?.addEventListener("click", () => {
    produkterContainer.appendChild(createProductRow());
  });

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
      console.error("Kunne ikke hente avsender", err);
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
      console.error("Kunne ikke lagre sender", err);
    }
  });

});
