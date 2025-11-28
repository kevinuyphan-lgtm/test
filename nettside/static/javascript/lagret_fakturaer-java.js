document.addEventListener("DOMContentLoaded", function() {
  const sendBtn = document.getElementById("sendSelected");
  const fakturaContainer = document.querySelector(".faktura-container");
  const sendPopup = document.getElementById("sendPopup");
  const cancelSend = document.getElementById("cancelSend");
  const confirmSend = document.getElementById("confirmSend");
  const addEmail = document.getElementById("addEmail");
  const emailContainer = document.getElementById("emailContainer");
  const searchInput = document.getElementById("searchInput");
  const sortSelect = document.getElementById("sortSelect");

  function updateSendBtn() {
    const checkboxes = document.querySelectorAll('input[name="faktura"]');
    const anyChecked = Array.from(checkboxes).some(cb => cb.checked);
    if(anyChecked) {
      sendBtn.classList.add("active");
      sendBtn.disabled = false;
    } else {
      sendBtn.classList.remove("active");
      sendBtn.disabled = true;
    }
  }

  // === Håndter checkbox clicks ===
  fakturaContainer.addEventListener("change", updateSendBtn);
  updateSendBtn();

  // === Åpne send-popup ===
  sendBtn.addEventListener("click", () => {
    if(sendBtn.disabled) return;
    emailContainer.innerHTML = `<div class="email-field"><input type="email" placeholder="Skriv inn epost" class="email-input"></div>`;
    confirmSend.disabled = true;
    confirmSend.classList.remove("active");
    sendPopup.style.display = "flex";
  });

  // === Avbryt popup ===
  cancelSend.addEventListener("click", () => sendPopup.style.display = "none");

  // === Legg til email felt ===
  addEmail.addEventListener("click", () => {
    const div = document.createElement("div");
    div.classList.add("email-field");
    div.innerHTML = `<input type="email" placeholder="Skriv inn epost" class="email-input">`;
    emailContainer.appendChild(div);
  });

  // === Aktiver send-knapp ===
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

  // === Send fakturaer ===
  confirmSend.addEventListener("click", () => {
    if(confirmSend.disabled) return;
    const emails = Array.from(emailContainer.querySelectorAll("input.email-input")).map(i => i.value.trim());
    const selected = Array.from(document.querySelectorAll('input[name="faktura"]:checked')).map(cb => cb.value);
    console.log("Sender fakturaer:", selected, "til:", emails);
    sendPopup.style.display = "none";
  });

  // === Søkefunksjon ===
  if(searchInput) {
    searchInput.addEventListener("input", () => {
      const filter = searchInput.value.toLowerCase();
      const boxes = fakturaContainer.querySelectorAll(".faktura-box");
      boxes.forEach(box => {
        const text = box.querySelector(".faktura-info").textContent.toLowerCase();
        box.style.display = text.includes(filter) ? "flex" : "none";
      });
    });
  }

  // === Sortering ===
  if(sortSelect) {
    sortSelect.addEventListener("change", () => {
      const boxes = Array.from(fakturaContainer.querySelectorAll(".faktura-box"));
      const type = sortSelect.value;
      boxes.sort((a,b) => {
        const aText = a.querySelector(".faktura-info").textContent;
        const bText = b.querySelector(".faktura-info").textContent;
        if(type === "name") return aText.localeCompare(bText);
        if(type === "date") {
          const aDate = new Date(aText.match(/\d{2}\.\d{2}\.\d{4}/)[0].split(".").reverse().join("-"));
          const bDate = new Date(bText.match(/\d{2}\.\d{2}\.\d{4}/)[0].split(".").reverse().join("-"));
          return bDate - aDate; // nyeste først
        }
      });
      boxes.forEach(box => fakturaContainer.appendChild(box));
    });
  }

  // === Nedlast knapp ===
  fakturaContainer.addEventListener("click", e => {
    if(e.target.classList.contains("download-btn")) {
      const parentBox = e.target.closest(".faktura-box");
      const filename = parentBox.querySelector(".faktura-info").textContent;
      console.log("Nedlast:", filename);
      // TODO: Backend nedlast
    }
  });

});
