document.addEventListener("DOMContentLoaded", function () {

  /* ============================
      ELEMENTER
  ============================ */
  const sendBtn = document.getElementById("sendSelected");
  const fakturaContainer = document.querySelector(".faktura-container");
  const sendPopup = document.getElementById("sendPopup");
  const cancelSend = document.getElementById("cancelSend");
  const confirmSend = document.getElementById("confirmSend");
  const addEmail = document.getElementById("addEmail");
  const emailContainer = document.getElementById("emailContainer");

  const searchInput = document.getElementById("searchFaktura");
  const sortSelect = document.getElementById("sortFaktura");

  /* PDF PREVIEW (optional container) */
  const pdfPreview = document.getElementById("pdfPreview"); // må eksistere i HTML


  /* ============================
      UPDATE CHECKBOX + SEND KNAPP
  ============================ */
  function getCheckboxes() {
    return document.querySelectorAll('input[name="faktura"]');
  }

  function updateSendBtn() {
    const anyChecked = Array.from(getCheckboxes()).some(cb => cb.checked);
    if (anyChecked) {
      sendBtn.classList.add("active");
      sendBtn.disabled = false;
    } else {
      sendBtn.classList.remove("active");
      sendBtn.disabled = true;
    }
  }

  updateSendBtn();
  fakturaContainer.addEventListener("change", updateSendBtn);


  /* ============================
      SEARCH
  ============================ */
  if (searchInput) {
    searchInput.addEventListener("input", function () {
      const query = searchInput.value.toLowerCase();
      const boxes = document.querySelectorAll(".faktura-box");

      boxes.forEach(box => {
        const text = box.innerText.toLowerCase();
        box.style.display = text.includes(query) ? "flex" : "none";
      });
    });
  }


  /* ============================
      SORTERING
  ============================ */
  if (sortSelect) {
    sortSelect.addEventListener("change", function () {
      const type = sortSelect.value;
      const boxes = Array.from(document.querySelectorAll(".faktura-box"));

      boxes.sort((a, b) => {
        const textA = a.innerText.toLowerCase();
        const textB = b.innerText.toLowerCase();

        if (type === "a-z") return textA.localeCompare(textB);
        if (type === "z-a") return textB.localeCompare(textA);
        return 0;
      });

      boxes.forEach(b => fakturaContainer.appendChild(b));
    });
  }


  /* ============================
      PDF PREVIEW
  ============================ */
  if (pdfPreview) {
    fakturaContainer.addEventListener("click", function (e) {
      const box = e.target.closest(".faktura-box");
      if (!box) return;

      const fileName = box.querySelector(".faktura-info")?.textContent.split(" – ")[0];

      if (fileName) {
        pdfPreview.setAttribute("src", `/static/fakturaer/${fileName}.pdf`);
        pdfPreview.parentElement.style.display = "block";
      }
    });
  }


  /* ============================
      ÅPNE POPUP
  ============================ */
  sendBtn.addEventListener("click", () => {
    if (sendBtn.disabled) return;

    // Reset emails
    emailContainer.innerHTML =
      `<div class="email-field"><input type="email" class="email-input" placeholder="Skriv inn epost"></div>`;

    confirmSend.disabled = true;
    confirmSend.classList.remove("active");

    sendPopup.style.display = "flex";
  });


  /* ============================
      AVBRYT POPUP
  ============================ */
  cancelSend.addEventListener("click", () => {
    sendPopup.style.display = "none";
  });


  /* ============================
      LEGG TIL NY EMAIL
  ============================ */
  addEmail.addEventListener("click", () => {
    const div = document.createElement("div");
    div.classList.add("email-field");
    div.innerHTML = `<input type="email" class="email-input" placeholder="Skriv inn epost">`;
    emailContainer.appendChild(div);
  });


  /* ============================
      EMAIL VALIDATION + ENABLE SEND
  ============================ */
  function validateEmails() {
    const inputs = emailContainer.querySelectorAll(".email-input");

    const allValid = Array.from(inputs).every(input => {
      const v = input.value.trim();
      return v.length > 5 && v.includes("@") && v.includes(".");
    });

    if (allValid && inputs.length > 0) {
      confirmSend.disabled = false;
      confirmSend.classList.add("active");
    } else {
      confirmSend.disabled = true;
      confirmSend.classList.remove("active");
    }
  }

  emailContainer.addEventListener("input", validateEmails);


  /* ============================
      SEND FAKTURAER
  ============================ */
  confirmSend.addEventListener("click", () => {
    if (confirmSend.disabled) return;

    const emails = Array.from(emailContainer.querySelectorAll(".email-input"))
      .map(i => i.value.trim());

    const selected = Array.from(getCheckboxes())
      .filter(cb => cb.checked)
      .map(cb => cb.value);

    console.log("SENDER:", selected, "TIL:", emails);

    // Fetch-code her hvis du vil sende til backend

    sendPopup.style.display = "none";
  });

});
