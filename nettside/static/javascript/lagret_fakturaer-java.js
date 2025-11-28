document.addEventListener("DOMContentLoaded", function() {
  const sendBtn = document.getElementById("sendSelected");
  const fakturaContainer = document.getElementById("fakturaContainer");
  const sendPopup = document.getElementById("sendPopup");
  const cancelSend = document.getElementById("cancelSend");
  const confirmSend = document.getElementById("confirmSend");
  const addEmail = document.getElementById("addEmail");
  const emailContainer = document.getElementById("emailContainer");
  const searchInput = document.getElementById("searchInput");
  const sortSelect = document.getElementById("sortSelect");

  // update send button state
  function updateSendBtn() {
    const anyChecked = Array.from(fakturaContainer.querySelectorAll(".faktura-checkbox")).some(cb => cb.checked);
    sendBtn.disabled = !anyChecked;
    sendBtn.classList.toggle("active", anyChecked);
  }
  fakturaContainer.addEventListener("change", updateSendBtn);
  updateSendBtn();

  sendBtn.addEventListener("click", () => {
    if(sendBtn.disabled) return;
    emailContainer.innerHTML = `<div class="email-field"><input type="email" class="email-input" placeholder="Skriv inn epost"></div>`;
    confirmSend.disabled = true;
    confirmSend.classList.remove("active");
    sendPopup.style.display = "flex";
  });

  cancelSend.addEventListener("click", () => sendPopup.style.display = "none");

  addEmail.addEventListener("click", () => {
    const div = document.createElement("div");
    div.classList.add("email-field");
    div.innerHTML = `<input type="email" class="email-input" placeholder="Skriv inn epost">`;
    emailContainer.appendChild(div);
  });

  emailContainer.addEventListener("input", () => {
    const inputs = emailContainer.querySelectorAll(".email-input");
    const allFilled = Array.from(inputs).every(i => i.value.trim() !== "");
    confirmSend.disabled = !allFilled || inputs.length === 0;
    confirmSend.classList.toggle("active", allFilled && inputs.length > 0);
  });

  confirmSend.addEventListener("click", () => {
    const emails = Array.from(emailContainer.querySelectorAll(".email-input")).map(i => i.value.trim());
    const selected = Array.from(fakturaContainer.querySelectorAll(".faktura-checkbox:checked")).map(cb => cb.value);
    fetch("/send-faktura-ajax", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ faktura_ids: selected, emails })
    }).then(r => r.json()).then(res => {
      if(res.success) location.reload();
      else alert("Noe gikk galt ved sending");
    });
  });

  // search functionality
  searchInput.addEventListener("input", () => {
    const filter = searchInput.value.toLowerCase();
    fakturaContainer.querySelectorAll(".faktura-card").forEach(card => {
      card.style.display = card.dataset.navn.toLowerCase().includes(filter) ? "block" : "none";
    });
  });

  // sort functionality
  sortSelect.addEventListener("change", () => {
    const cards = Array.from(fakturaContainer.querySelectorAll(".faktura-card"));
    const val = sortSelect.value;
    cards.sort((a,b) => {
      if(val.includes("dato")){
        const ad = new Date(a.dataset.dato), bd = new Date(b.dataset.dato);
        return val === "dato_desc" ? bd - ad : ad - bd;
      } else {
        const an = a.dataset.navn.toLowerCase(), bn = b.dataset.navn.toLowerCase();
        return val === "navn_asc" ? an.localeCompare(bn) : bn.localeCompare(an);
      }
    });
    cards.forEach(c => fakturaContainer.appendChild(c));
  });
});
