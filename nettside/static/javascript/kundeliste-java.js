document.addEventListener("DOMContentLoaded", function() {
  const popup = document.getElementById('popup');
  const popupTitle = document.getElementById('popupTitle');
  const saveChanges = document.getElementById('saveChanges');
  const cancelPopup = document.getElementById('cancelPopupBtn');

  const inputs = {
    navn: document.getElementById('popupNavn'),
    firma: document.getElementById('popupFirma'),
    adresse: document.getElementById('popupAdresse'),
    orgnr: document.getElementById('popupOrgnr'),
    referanse: document.getElementById('popupReferanse'),
    telefon: document.getElementById('popupTelefon'),
    epost: document.getElementById('popupEpost')
  };

  // Åpne popup
  document.getElementById('newKundeBtn').addEventListener('click', () => {
    popupTitle.textContent = "Ny Kunde";
    Object.values(inputs).forEach(i => i.value = '');
    saveChanges.disabled = true;
    saveChanges.classList.remove('active');
    popup.style.display = 'flex';
  });

  // Lukk popup
  cancelPopup.addEventListener('click', () => {
    popup.style.display = 'none';
  });

  // Aktiver lagre-knapp når alle feltene fylles
  Object.values(inputs).forEach(input => {
    input.addEventListener('input', () => {
      const allFilled = Object.values(inputs).every(i => i.value.trim() !== '');
      if(allFilled){
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

  // Her kan du legge til AJAX/fetch for å lagre kunde på backend
  saveChanges.addEventListener('click', () => {
    if(saveChanges.disabled) return;
    console.log("Lagre kunde:", Object.fromEntries(
      Object.entries(inputs).map(([k,v]) => [k, v.value])
    ));
    popup.style.display = 'none';
  });
});
