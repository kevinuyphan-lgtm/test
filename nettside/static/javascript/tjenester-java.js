document.addEventListener("DOMContentLoaded", () => {

/* ======================================
   DATO SYNK (UTEN UTC-BUG)
====================================== */

const invoiceDisplay = document.getElementById("invoice_date_display");
const invoiceHidden = document.getElementById("invoice_date");
const daysInput = document.getElementById("forfalls_dager");
const dueDisplay = document.getElementById("due_date_display");
const dueHidden = document.getElementById("due_date");

function formatDisplay(date) {
  const d = String(date.getDate()).padStart(2, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
}

function formatISO(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseDisplay(str) {
  const parts = str.split("/");
  if (parts.length !== 3) return null;
  const [d, m, y] = parts.map(Number);
  if (!d || !m || !y) return null;
  return new Date(y, m - 1, d);
}

if (invoiceDisplay && invoiceHidden) {
  const today = new Date();
  invoiceDisplay.value = formatDisplay(today);
  invoiceHidden.value = formatISO(today);
}

invoiceDisplay?.addEventListener("input", () => {
  const date = parseDisplay(invoiceDisplay.value);
  if (!date) return;
  invoiceHidden.value = formatISO(date);
  updateDueFromDays();
});

function updateDueFromDays() {
  const base = parseDisplay(invoiceDisplay.value);
  if (!base) return;

  const days = parseInt(daysInput.value) || 0;
  const due = new Date(base);
  due.setDate(due.getDate() + days);

  dueDisplay.value = formatDisplay(due);
  dueHidden.value = formatISO(due);
}

daysInput?.addEventListener("input", updateDueFromDays);

dueDisplay?.addEventListener("input", () => {
  const base = parseDisplay(invoiceDisplay.value);
  const due = parseDisplay(dueDisplay.value);
  if (!base || !due) return;

  dueHidden.value = formatISO(due);

  const diff = Math.round((due - base) / (1000 * 60 * 60 * 24));
  daysInput.value = diff >= 0 ? diff : 0;
});

updateDueFromDays();

/* ===============================
   AUTOFYLL KUNDE
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
   PRODUKTER – CHIP VERSION
=============================== */

const produkterContainer = document.getElementById("produkter-container");
const addProductBtn = document.getElementById("addProductBtn");

function createProductRow() {

  const row = document.createElement("div");
  row.className = "produkt-row product-card";

   row.innerHTML = `
       <input type="text" name="navn[]" placeholder="Produkt" required>
   
       <input type="number" name="antall[]" placeholder="Antall" min="1" value="1" required>
   
       <input type="number" name="pris[]" placeholder="Pris" step="0.01" min="0" required>
   
       <div class="mva-group">
         <div class="mva-row">
           <button type="button" class="mva-chip" data-value="0">0%</button>
           <button type="button" class="mva-chip" data-value="12">12%</button>
         </div>
         <div class="mva-row">
           <button type="button" class="mva-chip" data-value="15">15%</button>
           <button type="button" class="mva-chip active" data-value="25">25%</button>
         </div>
         <input type="hidden" name="mva[]" value="25">
       </div>
   
       <button type="button" class="remove-product-btn">Fjern</button>
   `;

  const chips = row.querySelectorAll(".mva-chip");
   const hiddenInput = row.querySelector("input[name='mva[]']");

  chips.forEach(chip => {
    chip.addEventListener("click", () => {

      chips.forEach(c => c.classList.remove("active"));
      chip.classList.add("active");

      hiddenInput.value = chip.dataset.value;
    });
  });

  row.querySelector(".remove-product-btn").addEventListener("click", () => {
    if (produkterContainer.children.length > 1) {
      row.remove();
    }
  });

  return row;
}

if (produkterContainer) {

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
