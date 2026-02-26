document.addEventListener("DOMContentLoaded", () => {

  /* =====================================
     ELEMENTS
  ===================================== */

  const drawerOverlay = document.getElementById("drawerOverlay");
  const popupTitle = document.getElementById("popupTitle");

  const saveChanges = document.getElementById("saveChanges");
  const deleteConfirmBtn = document.getElementById("deleteConfirmBtn");

  const cancelPopup = document.getElementById("cancelPopupBtn");
  const closeDrawerBtn = document.getElementById("closeDrawer");
  const newKundeBtn = document.getElementById("newKundeBtn");

  const formSection = document.getElementById("formSection");
  const deleteSection = document.getElementById("deleteSection");
  const deleteCustomerInfo = document.getElementById("deleteCustomerInfo");

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

    // Reset UI state
    formSection.style.display = "block";
    deleteSection.style.display = "none";

    saveChanges.style.display = "inline-block";
    deleteConfirmBtn.style.display = "none";

    deleteConfirmBtn.disabled = false;
    deleteConfirmBtn.textContent = "Slett kunde";
  }

  cancelPopup?.addEventListener("click", closeDrawer);
  closeDrawerBtn?.addEventListener("click", closeDrawer);

  drawerOverlay?.addEventListener("click", (e) => {
    if (e.target === drawerOverlay) closeDrawer();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeDrawer();
  });

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
     NEW CUSTOMER
  ===================================== */

  newKundeBtn?.addEventListener("click", () => {

    editMode = false;
    currentKundeId = null;

    popupTitle.textContent = "Ny kunde";

    resetForm();

    formSection.style.display = "block";
    deleteSection.style.display = "none";

    deleteConfirmBtn.style.display = "none";
    saveChanges.style.display = "inline-block";

    openDrawer();
    inputs.navn.focus();
  });

  /* =====================================
     EVENT DELEGATION
  ===================================== */

  document.addEventListener("click", (e) => {

    /* -------- EDIT -------- */
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

      formSection.style.display = "block";
      deleteSection.style.display = "none";

      deleteConfirmBtn.style.display = "none";
      saveChanges.style.display = "inline-block";

      openDrawer();
      inputs.navn.focus();
      return;
    }

    /* -------- DELETE -------- */
    const deleteBtn = e.target.closest(".delete-btn");
    if (deleteBtn) {
      const row = deleteBtn.closest(".kunde-row");
      if (!row) return;

      editMode = false;
      currentKundeId = row.dataset.id;

      popupTitle.textContent = "Slett kunde";

      // Bytt view
      formSection.style.display = "none";
      deleteSection.style.display = "block";

      // Fyll inn info
      deleteCustomerInfo.innerHTML = `
        <strong>${row.dataset.navn || "-"}</strong>
        ${row.dataset.firma ? `<div>Firma: ${row.dataset.firma}</div>` : ""}
        <div>Org.nr: ${row.dataset.orgnr || "-"}</div>
        <div>Adresse: ${row.dataset.adresse || "-"}</div>
        ${row.dataset.referanse ? `<div>Referanse: ${row.dataset.referanse}</div>` : ""}
        ${row.dataset.telefon ? `<div>Telefon: ${row.dataset.telefon}</div>` : ""}
        ${row.dataset.epost ? `<div>E-post: ${row.dataset.epost}</div>` : ""}
      `;
      saveChanges.style.display = "none";
      deleteConfirmBtn.style.display = "inline-block";

      openDrawer();
      return;
    }

  });

  /* =====================================
     SAVE
  ===================================== */

  saveChanges?.addEventListener("click", async () => {

    if (saveChanges.disabled) return;

    const data = collectData();
    const url = editMode && currentKundeId
      ? `/update-kunde/${currentKundeId}`
      : `/add-kunde`;

    const originalText = saveChanges.textContent;

    try {
      saveChanges.disabled = true;
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
      alert("Serverfeil");
      saveChanges.disabled = false;
      saveChanges.textContent = originalText;
    }

  });

  /* =====================================
     DELETE CONFIRM
  ===================================== */

  deleteConfirmBtn?.addEventListener("click", async () => {

    if (!currentKundeId) return;

    deleteConfirmBtn.disabled = true;
    deleteConfirmBtn.textContent = "Sletter...";

    try {
      const response = await fetch(`/delete-kunde/${currentKundeId}`, {
        method: "POST",
      });

      const result = await response.json();

      if (result.success) {
        location.reload();
      } else {
        alert(result.message || "Kunne ikke slette");
        deleteConfirmBtn.disabled = false;
        deleteConfirmBtn.textContent = "Slett kunde";
      }

    } catch (error) {
      alert("Serverfeil");
      deleteConfirmBtn.disabled = false;
      deleteConfirmBtn.textContent = "Slett kunde";
    }

  });

/* =====================================
   SEARCH FUNCTION
===================================== */

const searchInput = document.getElementById("searchInput");
const table = document.getElementById("kundeTable");

searchInput?.addEventListener("input", () => {

  const searchValue = searchInput.value.toLowerCase().trim();

  if (!table) return;

  const rows = table.querySelectorAll("tbody tr");

  rows.forEach(row => {

    const textContent = row.textContent.toLowerCase();

    if (textContent.includes(searchValue)) {
      row.style.display = "";
    } else {
      row.style.display = "none";
    }

  });

});
  
});
