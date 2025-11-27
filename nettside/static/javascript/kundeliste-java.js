document.addEventListener("DOMContentLoaded", function() {

  const fakturaCheckboxes = document.querySelectorAll('input[name="faktura"]');
  const sendSelectedBtn = document.getElementById('sendSelected');
  const sendPopup = document.getElementById('sendPopup');
  const cancelSend = document.getElementById('cancelSend');
  const confirmSend = document.getElementById('confirmSend');
  const emailContainer = document.getElementById('emailContainer');
  const addEmailBtn = document.getElementById('addEmail');

  // FUNKSJON: Oppdater send-knapp status
  function updateSendButton() {
    const anyChecked = Array.from(fakturaCheckboxes).some(cb => cb.checked);
    if(anyChecked) {
      sendSelectedBtn.classList.add('active');
      sendSelectedBtn.disabled = false;
    } else {
      sendSelectedBtn.classList.remove('active');
      sendSelectedBtn.disabled = true;
    }
  }

  // Legg til change-event på alle faktura-checkboxer
  fakturaCheckboxes.forEach(cb => {
    cb.addEventListener('change', updateSendButton);
  });

  // Åpne popup når send-knappen trykkes
  sendSelectedBtn.addEventListener('click', () => {
    sendPopup.style.display = 'flex';
    confirmSend.disabled = true;
    confirmSend.classList.remove('active');
  });

  // Lukk popup
  cancelSend.addEventListener('click', () => {
    sendPopup.style.display = 'none';
  });

  // Legg til flere epost-felt
  addEmailBtn.addEventListener('click', () => {
    const div = document.createElement('div');
    div.classList.add('email-field');
    div.innerHTML = `<input type="email" placeholder="Skriv inn epost" class="email-input">`;
    emailContainer.appendChild(div);
    setupEmailValidation(div.querySelector('input'));
  });

  // Epost-validering
  function setupEmailValidation(input){
    input.addEventListener('input', () => {
      const allEmails = document.querySelectorAll('.email-input');
      const allFilled = Array.from(allEmails).some(i => i.value.trim() !== '');
      const allValid = Array.from(allEmails).every(i => i.value === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(i.value));
      
      if(allFilled && allValid){
        confirmSend.disabled = false;
        confirmSend.classList.add('active');
      } else {
        confirmSend.disabled = true;
        confirmSend.classList.remove('active');
      }
    });
  }

  // Initial setup av eksisterende email-felt
  document.querySelectorAll('.email-input').forEach(input => setupEmailValidation(input));

});
