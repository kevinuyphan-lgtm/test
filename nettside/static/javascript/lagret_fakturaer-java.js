document.addEventListener("DOMContentLoaded", function() {

  // === ELEMENTER ===
  const sendBtn = document.getElementById("sendSelected");
  const checkboxes = document.querySelectorAll('input[name="faktura"]');
  const sendPopup = document.getElementById("sendPopup");
  const cancelSend = document.getElementById("cancelSend");
  const confirmSend = document.getElementById("confirmSend");
  const addEmail = document.getElementById("addEmail");
  const emailContainer = document.getElementById("emailContainer");

  // === OPPDATER SEND-BUTTON ===
  function updateSendBtn() {
    const anyChecked = Array.from(checkboxes).some(cb => cb.checked);
    if(anyChecked) {
      sendBtn.classList.add("active");
      sendBtn.disabled = false;
    } else {
      sendBtn.classList.remove("active");
      sendBtn.disabled = true;
    }
  }

  checkboxes.forEach(cb => cb.addEventListener("change", updateSendBtn));
  updateSendBtn();

  // === ÅPNE POPUP ===
  sendBtn.addEventListener("click", () => {
    if(sendBtn.disabled) return;
    // Nullstill emails
    emailContainer.innerHTML = `<div class="email-field"><input type="email" placeholder="Skriv inn epost" class="email-input"></div>`;
    confirmSend.disabled = true;
    confirmSend.classList.remove("active");
    sendPopup.style.display = "flex";
  });

  // === AVBRYT POPUP ===
  cancelSend.addEventListener("click", () => {
    sendPopup.style.display = "none";
  });

  // === LEGG TIL NY EMAIL FELT ===
  addEmail.addEventListener("click", () => {
    const div = document.createElement("div");
    div.classList.add("email-field");
    div.innerHTML = `<input type="email" placeholder="Skriv inn epost" class="email-input">`;
    emailContainer.appendChild(div);
  });

  // === AKTIVER SEND KNAPP NÅR ALLE FELTER FYLT ===
  emailContainer.addEventListener("input", () => {
    const inputs = emailContainer.querySelectorAll("input.email-input");
    const allFilled = Array.from(inputs).every(i => i.value.trim() !== "");
    if(allFilled && inputs.length > 0) {
      confirmSend.disabled = false;
      confirmSend.classList.add("active");
    } else {
      confirmSend.disabled = true;
      confirmSend.classList.remove("active");
    }
  });

  // === SEND FAKTURAER ===
  confirmSend.addEventListener("click", () => {
    if(confirmSend.disabled) return;
    const emails = Array.from(emailContainer.querySelectorAll("input.email-input")).map(i => i.value.trim());
    const selected = Array.from(checkboxes).filter(cb => cb.checked).map(cb => cb.value);
    console.log("Sender fakturaer:", selected, "til:", emails);
    // TODO: send til backend via fetch/ajax
    sendPopup.style.display = "none";
  });

});
