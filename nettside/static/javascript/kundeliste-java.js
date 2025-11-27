document.addEventListener("DOMContentLoaded", function() {

  // ===== POPUP NY/EDIT KUNDE =====
  const popup = document.getElementById('popup');
  const closePopup = document.getElementById('closePopup');
  const popupTitle = document.getElementById('popupTitle');
  const saveChanges = document.getElementById('saveChanges');

  const inputs = {
    navn: document.getElementById('popupNavn'),
    firma: document.getElementById('popupFirma'),
    adresse: document.getElementById('popupAdresse'),
    orgnr: document.getElementById('popupOrgnr'),
    referanse: document.getElementById('popupReferanse'),
    telefon: document.getElementById('popupTelefon'),
    epost: document.getElementById('popupEpost')
  };

  // Åpne popup for ny kunde
  document.getElementById('newKundeBtn').addEventListener('click', () => {
    popupTitle.textContent = "Ny Kunde";
    Object.values(inputs).forEach(i => i.value = '');
    saveChanges.disabled = true;
    saveChanges.classList.remove('active');
    popup.style.display = 'flex';
  });

  // Lukk popup
  closePopup.addEventListener('click', () => popup.style.display = 'none');

  // Aktiver lagre-knapp når minst ett felt fylles
  Object.values(inputs).forEach(input => {
    input.addEventListener('input', () => {
      const anyFilled = Object.values(inputs).some(i => i.value.trim() !== '');
      if(anyFilled){
        saveChanges.disabled = false;
        saveChanges.classList.add('active');
      } else {
        saveChanges.disabled = true;
        saveChanges.classList.remove('active');
      }
    });
  });

  // Rediger eksisterende kunde
  document.querySelectorAll('.edit-icon').forEach(icon => {
    icon.addEventListener('click', (e) => {
      const row = e.target.closest('tr');
      popupTitle.textContent = "Rediger Kunde";
      inputs.navn.value = row.dataset.navn || '';
      inputs.firma.value = row.dataset.firma || '';
      inputs.adresse.value = row.dataset.adresse || '';
      inputs.orgnr.value = row.dataset.orgnr || '';
      inputs.referanse.value = row.dataset.referanse || '';
      inputs.telefon.value = row.dataset.telefon || '';
      inputs.epost.value = row.dataset.epost || '';
      saveChanges.disabled = false;
      saveChanges.classList.add('active');
      popup.style.display = 'flex';
    });
  });

  // ===== SLETT POPUP =====
  const deletePopup = document.getElementById('deletePopup');
  const cancelDelete = document.getElementById('cancelDelete');
  const confirmDelete = document.getElementById('confirmDelete');
  let currentDeleteId = null;

  document.querySelectorAll('.delete-icon').forEach(icon => {
    icon.addEventListener('click', (e) => {
      const row = e.target.closest('tr');
      currentDeleteId = row.dataset.id;
      deletePopup.style.display = 'flex';
    });
  });

  cancelDelete.addEventListener('click', () => {
    deletePopup.style.display = 'none';
    currentDeleteId = null;
  });

  confirmDelete.addEventListener('click', () => {
    if(currentDeleteId){
      console.log("Slett kunde med id:", currentDeleteId);
      // Her kan du gjøre ajax/fetch request for å slette på backend
      deletePopup.style.display = 'none';
    }
  });

});
