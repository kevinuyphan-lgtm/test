document.addEventListener("DOMContentLoaded", function () {

  const popup = document.getElementById("popup");
  const deletePopup = document.getElementById("deletePopup");
  const popupTitle = document.getElementById("popupTitle");
  const saveChanges = document.getElementById("saveChanges");
  const cancelPopup = document.getElementById("cancelPopupBtn");
  const confirmDelete = document.getElementById("confirmDelete");
  const cancelDelete = document.getElementById("cancelDelete");

  let editMode = false;
  let currentKundeId = null;

  const inputs = {
    navn: document.getElementById("popupNavn"),
    firma: document.getElementById("popupFirma"),
    adresse: document.getElementById("popupAdresse"),
    orgnr: document.getElementById("popupOrgnr"),
    referanse: document.getElementById("popupReferanse"),
    telefon: document.getElementById("popupTelefon"),
    epost: document.getElementById("popupEpost"),
  };

  function resetForm() {
    Object.values(inputs).forEach((i) => (i.value = ""));
    saveChanges.disabled = true;
    saveChanges.classList.remove("active");
  }

  function collectData() {
    return Object.fromEntries(
      Object.entries(inputs).map(([k, v]) => [k, v.value])
    );
  }

  function enableButtonIfValid() {
    const allFilled = Object.values(inputs).every(
      (i) => i.value.trim() !== ""
    );
    saveChanges.disabled = !allFilled;
    saveChanges.classList.toggle("active", allFilled);
  }

  Object.values(inputs).forEach((input) => {
    input.addEventListener("input", enableButtonIfValid);
  });

  // ---------------------------
  // NY KUNDE
  // ---------------------------
  document.getElementById("newKundeBtn").addEventListener("click", () => {
    editMode = false;
    currentKundeId = null;
    popupTitle.textContent = "Ny Kunde";
    resetForm();
    popup.style.display = "flex";
  });

  cancelPopup.addEventListener("click", () => {
    popup.style.display = "none";
  });

  // ---------------------------
  // REDIGER
  // ---------------------------
  document.querySelectorAll(".edit-icon").forEach((icon) => {
    icon.addEventListener("click", (e) => {
      const row = e.target.closest("tr");

      editMode = true;
      currentKundeId = row.dataset.id;
      popupTitle.textContent = "Rediger Kunde";

      inputs.navn.value = row.dataset.navn || "";
      inputs.firma.value = row.dataset.firma || "";
      inputs.adresse.value = row.dataset.adresse || "";
      inputs.orgnr.value = row.dataset.orgnr || "";
      inputs.referanse.value = row.dataset.referanse || "";
      inputs.telefon.value = row.dataset.telefon || "";
      inputs.epost.value = row.dataset.epost || "";

      enableButtonIfValid();
      popup.style.display = "flex";
    });
  });

  // ---------------------------
  // LAGRE (ADD / UPDATE)
  // ---------------------------
  saveChanges.addEventListener("click", async () => {
    if (saveChanges.disabled) return;

    const data = collectData();

    try {
      let url = "/add-kunde";
      if (editMode && currentKundeId) {
        url = `/update-kunde/${currentKundeId}`;
      }

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        location.reload();
      } else {
        alert(result.message || "Noe gikk galt");
      }
    } catch (error) {
      console.error("Serverfeil:", error);
      alert("Serverfeil");
    }
  });

  // ---------------------------
  // SLETT
  // ---------------------------
  document.querySelectorAll(".delete-btn").forEach((icon) => {
    icon.addEventListener("click", (e) => {
      const row = e.target.closest("tr");
      currentKundeId = row.dataset.id;
      deletePopup.style.display = "flex";
    });
  });

  cancelDelete.addEventListener("click", () => {
    deletePopup.style.display = "none";
  });

  confirmDelete.addEventListener("click", async () => {
    if (!currentKundeId) return;

    try {
      const response = await fetch(`/delete-kunde/${currentKundeId}`, {
        method: "POST",
      });

      const result = await response.json();

      if (result.success) {
        location.reload();
      } else {
        alert(result.message || "Kunne ikke slette");
      }
    } catch (error) {
      console.error("Serverfeil:", error);
      alert("Serverfeil");
    }
  });
});
