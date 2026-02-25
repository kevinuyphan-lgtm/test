document.addEventListener("DOMContentLoaded", function () {

  /* ===============================
     ELEMENTS
  =============================== */

  const tableBody = document.getElementById("invoiceTableBody");
  const sendBtn = document.getElementById("sendSelected");
  const downloadBtn = document.getElementById("downloadSelected");
  const selectAll = document.getElementById("selectAll");

  const modal = document.getElementById("sendModal");
  const cancelSend = document.getElementById("cancelSend");
  const confirmSend = document.getElementById("confirmSend");
  const addEmail = document.getElementById("addEmail");
  const emailContainer = document.getElementById("emailContainer");


  /* ===============================
     TOAST SYSTEM
  =============================== */

  function showToast(message, type = "success") {

    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.innerText = message;

    document.body.appendChild(toast);

    setTimeout(() => {
      toast.classList.add("show");
    }, 50);

    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }


  /* ===============================
     CHECKBOX LOGIC
  =============================== */

  function getCheckboxes() {
    return Array.from(document.querySelectorAll(".invoice-checkbox"));
  }

  function getSelected() {
    return getCheckboxes().filter(cb => cb.checked);
  }

  function updateButtons() {
    const any = getSelected().length > 0;
    sendBtn.disabled = !any;
    downloadBtn.disabled = !any;
  }

  document.addEventListener("change", function (e) {

    if (e.target.classList.contains("invoice-checkbox")) {
      updateButtons();
    }

    if (e.target.id === "selectAll") {
      getCheckboxes().forEach(cb => cb.checked = e.target.checked);
      updateButtons();
    }

  });

  updateButtons();


  /* ===============================
     BULK DOWNLOAD
  =============================== */

  downloadBtn.addEventListener("click", function () {

    const selected = getSelected().map(cb => cb.value);

    if (!selected.length) {
      showToast("Ingen faktura valgt", "error");
      return;
    }

    window.location.href = "/bulk-download?ids=" + selected.join(",");
  });


  /* ===============================
     MODAL CONTROLS
  =============================== */

  function openModal() {
    modal.style.display = "flex";
    modal.classList.add("fade-in");
  }

  function closeModal() {
    modal.classList.remove("fade-in");
    setTimeout(() => {
      modal.style.display = "none";
    }, 200);
  }

  sendBtn.addEventListener("click", function () {

    if (sendBtn.disabled) return;

    emailContainer.innerHTML = `
      <div class="email-field">
        <input type="email" class="email-input" placeholder="Skriv inn e-post">
      </div>
    `;

    confirmSend.disabled = true;
    openModal();
  });

  cancelSend.addEventListener("click", closeModal);

  modal.addEventListener("click", function (e) {
    if (e.target === modal) closeModal();
  });


  /* ===============================
     ADD EMAIL FIELD
  =============================== */

  addEmail.addEventListener("click", function () {

    const div = document.createElement("div");
    div.classList.add("email-field");

    div.innerHTML = `
      <input type="email" class="email-input" placeholder="Skriv inn e-post">
    `;

    emailContainer.appendChild(div);
  });


  /* ===============================
     VALIDATE EMAIL INPUT
  =============================== */

  emailContainer.addEventListener("input", function () {

    const inputs = emailContainer.querySelectorAll(".email-input");

    const allValid = Array.from(inputs).every(i =>
      i.value.trim() !== "" && i.checkValidity()
    );

    confirmSend.disabled = !allValid || inputs.length === 0;
  });


  /* ===============================
     SEND VIA AJAX (PRO VERSION)
  =============================== */

  confirmSend.addEventListener("click", async function () {

    const emails = Array.from(emailContainer.querySelectorAll(".email-input"))
      .map(i => i.value.trim());

    const selected = getSelected().map(cb => cb.value);

    if (!selected.length) {
      showToast("Ingen faktura valgt", "error");
      return;
    }

    confirmSend.disabled = true;
    confirmSend.innerText = "Sender...";

    try {

      const response = await fetch("/send-ajax", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          faktura_ids: selected,
          emails: emails
        })
      });

      const data = await response.json();

      if (data.success) {
        showToast("Faktura(er) sendt!");
        closeModal();

        setTimeout(() => location.reload(), 1000);
      } else {
        showToast("Noe gikk galt ved sending", "error");
        confirmSend.disabled = false;
        confirmSend.innerText = "Send";
      }

    } catch (error) {

      showToast("Serverfeil. Prøv igjen.", "error");
      confirmSend.disabled = false;
      confirmSend.innerText = "Send";
    }

  });

});
