document.addEventListener("DOMContentLoaded", function() {
  const sendBtn = document.getElementById("sendSelected");
  const fakturaContainer = document.getElementById("fakturaContainer");
  const checkboxes = fakturaContainer.querySelectorAll('input[name="faktura"]');

  const sendPopup = document.getElementById("sendPopup");
  const cancelSend = document.getElementById("cancelSend");
  const confirmSend = document.getElementById("confirmSend");
  const addEmail = document.getElementById("addEmail");
  const emailContainer = document.getElementById("emailContainer");

  const searchInput = document.getElementById("searchInput");
  const sortSelect = document.getElementById("sortSelect");

  const previewPopup = document.getElementById("previewPopup");
  const pdfViewer = document.getElementById("pdfViewer");
  const closePreview = document.getElementById("closePreview");

  // === SEND KNAPP LOGIKK ===
  function updateSendBtn() {
    const anyChecked = Array.from(fakturaContainer.querySelectorAll('input[name="faktura"]')).some(cb => cb.checked);
    sendBtn.disabled = !anyChecked;
    sendBtn.classList.toggle("active", anyChecked);
  }

  fakturaContainer.addEventListener("change", updateSendBtn);
  updateSendBtn();

  sendBtn.addEventListener("click", () => {
    if(sendBtn.disabled) return;
    emailContainer.innerHTML = `<div class="email-field"><input type="email" placeholder="Skriv inn epost" class="email-input"></div>`;
    confirmSend.disabled = true;
    confirmSend.classList.remove("active");
    sendPopup.style.display = "flex";
  });

  cancelSend.addEventListener("click", () => sendPopup.style.display = "none");

  addEmail.addEventListener("click", () => {
    const div = document.createElement("div");
    div.classList.add("email-field");
    div.innerHTML = `<input type="email" placeholder="Skriv inn epost" class="email-input">`;
    emailContainer.appendChild(div);
  });

  emailContainer.addEventListener("input", () => {
    const inputs = emailContainer.querySelectorAll("input.email-input");
    const allFilled = Array.from(inputs).every(i => i.value.trim() !== "");
    confirmSend.disabled = !allFilled || inputs.length === 0;
    confirmSend.classList.toggle("active", allFilled && inputs.length > 0);
  });

  confirmSend.addEventListener("click", () => {
    const emails = Array.from(emailContainer.querySelectorAll("input.email-input")).map(i => i.value.trim());
    const selected = Array.from(fakturaContainer.querySelectorAll('input[name="faktura"]:checked')).map(cb => cb.value);

    fetch("/send-faktura-ajax", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ faktura_ids: selected, emails })
    })
    .then(r => r.json())
    .then(res => {
      if(res.success) location.reload();
      else alert("Noe gikk galt ved sending");
    });
  });

  // === SØK ===
  searchInput.addEventListener("input", () => {
    const filter = searchInput.value.toLowerCase();
    fakturaContainer.querySelectorAll(".faktura-box").forEach(box => {
      const name = box.dataset.navn.toLowerCase();
      box.style.display = name.includes(filter) ? "flex" : "none";
    });
  });

  // === SORTERING ===
  sortSelect.addEventListener("change", () => {
    const boxes = Array.from(fakturaContainer.querySelectorAll(".faktura-box"));
    const val = sortSelect.value;

    boxes.sort((a,b) => {
      if(val.includes("dato")) {
        const ad = new Date(a.dataset.dato), bd = new Date(b.dataset.dato);
        return val === "dato_desc" ? bd - ad : ad - bd;
      } else {
        const an = a.dataset.navn.toLowerCase(), bn = b.dataset.navn.toLowerCase();
        return val === "navn_asc" ? an.localeCompare(bn) : bn.localeCompare(an);
      }
    });
    boxes.forEach(b => fakturaContainer.appendChild(b));
  });

  // === PDF PREVIEW ===
  document.querySelectorAll(".preview-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      pdfViewer.src = `/faktura/${btn.dataset.file}`;
      previewPopup.style.display = "flex";
    });
  });

  closePreview.addEventListener("click", () => {
    pdfViewer.src = "";
    previewPopup.style.display = "none";
  });

  // === DOWNLOAD ===
  document.querySelectorAll(".download-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      window.open(`/faktura/${btn.dataset.file}`, "_blank");
    });
  });

});
