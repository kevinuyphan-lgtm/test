document.addEventListener("DOMContentLoaded", () => {

  const popup = document.getElementById("popup");
  const deletePopup = document.getElementById("deletePopup");
  const popupTitle = document.getElementById("popupTitle");
  const saveChanges = document.getElementById("saveChanges");
  const cancelPopup = document.getElementById("cancelPopupBtn");
  const confirmDelete = document.getElementById("confirmDelete");
  const cancelDelete = document.getElementById("cancelDelete");
  const newKundeBtn = document.getElementById("newKundeBtn");

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

  /* -----------------------------
     HELPERS
  ----------------------------- */

  function openPopup() {
    popup.style.display = "flex";
  }

  function closePopup() {
    popup.style.display = "none";
  }

  function openDeletePopup() {
    deletePopup.style.display = "flex";
  }

  function closeDeletePopup() {
    deletePopup.style.display = "none";
  }

  function resetForm() {
    Object.values(inputs).forEach(i => i.value = "");
    saveChanges.disabled = true;
    saveChanges.classList.remove("active");
  }

  function collectData() {
    return Object.fromEntries(
      Object.entries(inputs).map(([k, v]) => [k, v.value.trim()])
    );
  }

  function validateForm() {
    const allFilled = Object.values(inputs).every(
      i => i.value.trim() !== ""
    );

    saveChanges.disabled = !allFilled;
    saveChanges.classList.toggle("active", allFilled);
  }

  Object.values(inputs).forEach(input => {
    input.addEventListener("input", validateForm);
  });

  /* -----------------------------
     NY KUNDE
  ----------------------------- */

  newKundeBtn?.addEventListener("click", () => {
    editMode = false;
    currentKundeId = null;
    popupTitle.textContent = "Ny Kunde";
    resetForm();
    openPopup();
  });

  cancelPopup?.addEventListener("click", closePopup);

  /* -----------------------------
     REDIGER (EVENT DELEGATION)
  ----------------------------- */

  document.addEventListener("click", (e) => {
    const editBtn = e.target.closest(".edit-icon");
    if (!editBtn) return;

    const row = editBtn.closest("tr");
    if (!row) return;

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

    validateForm();
    openPopup();
  });

  /* -----------------------------
     SLETT (EVENT DELEGATION)
  ----------------------------- */

  document.addEventListener("click", (e) => {
    const deleteBtn = e.target.closest(".delete-btn");
    if (!deleteBtn) return;

    const row = deleteBtn.closest("tr");
    if (!row) return;

    currentKundeId = row.dataset.id;
    openDeletePopup();
  });

  cancelDelete?.addEventListener("click", closeDeletePopup);

  /* -----------------------------
     LAGRE
  ----------------------------- */

  saveChanges?.addEventListener("click", async () => {
    if (saveChanges.disabled) return;

    const data = collectData();
    const url = editMode && currentKundeId
      ? `/update-kunde/${currentKundeId}`
      : `/add-kunde`;

    try {
      saveChanges.disabled = true;

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        location.reload();
      } else {
        alert(result.message || "Noe gikk galt");
        saveChanges.disabled = false;
      }

    } catch (error) {
      console.error("Serverfeil:", error);
      alert("Serverfeil");
      saveChanges.disabled = false;
    }
  });

  /* -----------------------------
     BEKREFT SLETT
  ----------------------------- */

  confirmDelete?.addEventListener("click", async () => {
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
