document.addEventListener("DOMContentLoaded", () => {

  const drawerOverlay = document.getElementById("drawerOverlay");
  const deletePopup = document.getElementById("deletePopup");

  const popupTitle = document.getElementById("popupTitle");
  const saveChanges = document.getElementById("saveChanges");
  const cancelPopup = document.getElementById("cancelPopupBtn");
  const closeDrawerBtn = document.getElementById("closeDrawer");

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

  /* =====================================
     DRAWER CONTROL
  ===================================== */

  function openDrawer() {
    drawerOverlay.classList.add("active");
    document.body.classList.add("modal-open");
  }

  function closeDrawer() {
    drawerOverlay.classList.remove("active");
    document.body.classList.remove("modal-open");
  }

  function openDeletePopup() {
    deletePopup.style.display = "flex";
    document.body.classList.add("modal-open");
  }

  function closeDeletePopup() {
    deletePopup.style.display = "none";
    document.body.classList.remove("modal-open");
  }

  /* =====================================
     FORM HELPERS
  ===================================== */

  function resetForm() {
    Object.values(inputs).forEach(i => i.value = "");
    saveChanges.disabled = true;
  }

  function collectData() {
    return Object.fromEntries(
      Object.entries(inputs).map(([k, v]) => [k, v.value.trim()])
    );
  }

  function validateForm() {
    const requiredFields = ["navn", "adresse", "orgnr"];
    const valid = requiredFields.every(
      key => inputs[key].value.trim() !== ""
    );

    saveChanges.disabled = !valid;
  }

  Object.values(inputs).forEach(input => {
    input.addEventListener("input", validateForm);
  });

  /* =====================================
     NY KUNDE
  ===================================== */

  newKundeBtn?.addEventListener("click", () => {
    editMode = false;
    currentKundeId = null;
    popupTitle.textContent = "Ny kunde";
    resetForm();
    openDrawer();
    inputs.navn.focus();
  });

  cancelPopup?.addEventListener("click", closeDrawer);
  closeDrawerBtn?.addEventListener("click", closeDrawer);

  drawerOverlay?.addEventListener("click", (e) => {
    if (e.target === drawerOverlay) closeDrawer();
  });

  /* =====================================
     EVENT DELEGATION (EDIT + DELETE)
  ===================================== */

  document.addEventListener("click", (e) => {

    /* -------- REDIGER -------- */
    const editBtn = e.target.closest(".edit-btn");
    if (editBtn) {
      const row = editBtn.closest(".kunde-row");
      if (!row) return;

      editMode = true;
      currentKundeId = row.dataset.id;
      popupTitle.textContent = "Rediger kunde";

      inputs.navn.value = row.dataset.navn || "";
      inputs.firma.value = row.dataset.firma || "";
      inputs.adresse.value = row.dataset.adresse || "";
      inputs.orgnr.value = row.dataset.orgnr || "";
      inputs.referanse.value = row.dataset.referanse || "";
      inputs.telefon.value = row.dataset.telefon || "";
      inputs.epost.value = row.dataset.epost || "";

      validateForm();
      openDrawer();
      inputs.navn.focus();
      return;
    }

    /* -------- SLETT -------- */
    const deleteBtn = e.target.closest(".delete-btn");
    if (deleteBtn) {
      const row = deleteBtn.closest(".kunde-row");
      if (!row) return;

      currentKundeId = row.dataset.id;
      openDeletePopup();
      return;
    }

  });

  /* =====================================
     ESC CLOSE
  ===================================== */

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeDrawer();
      closeDeletePopup();
    }
  });

  cancelDelete?.addEventListener("click", closeDeletePopup);

  /* =====================================
     SAVE
  ===================================== */

  saveChanges?.addEventListener("click", async () => {

    if (saveChanges.disabled) return;

    const data = collectData();
    const url = editMode && currentKundeId
      ? `/update-kunde/${currentKundeId}`
      : `/add-kunde`;

    try {
      saveChanges.disabled = true;
      const originalText = saveChanges.textContent;
      saveChanges.textContent = "Lagrer...";

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
        saveChanges.textContent = originalText;
      }

    } catch (error) {
      console.error("Serverfeil:", error);
      alert("Serverfeil");
      saveChanges.disabled = false;
      saveChanges.textContent = "Lagre";
    }

  });

  /* =====================================
     DELETE CONFIRM
  ===================================== */

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
