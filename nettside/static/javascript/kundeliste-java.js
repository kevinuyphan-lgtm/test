document.addEventListener("DOMContentLoaded", function() {

  const checkboxes = document.querySelectorAll('input[name="faktura"]');
  const sendBtn = document.getElementById('sendSelected');
  const popup = document.getElementById('sendPopup');
  const cancelSend = document.getElementById('cancelSend');
  const confirmSend = document.getElementById('confirmSend');
  const emailContainer = document.getElementById('emailContainer');
  const addEmailBtn = document.getElementById('addEmail');

  // AKTIVER SEND KNAPP HVIS MINST EN CHECKED
  checkboxes.forEach(box => {
    box.addEventListener('change', () => {
      const anyChecked = Array.from(checkboxes).some(b => b.checked);
      if(anyChecked){
        sendBtn.classList.add('active');
        sendBtn.disabled = false;
      } else {
        sendBtn.classList.remove('active');
        sendBtn.disabled = true;
      }
    });
  });

  // ÅPNE POPUP
  sendBtn.addEventListener('click', () => {
    popup.style.display = 'flex';
  });

  // LUKK POPUP
  cancelSend.addEventListener('click', () => {
    popup.style.display = 'none';
    confirmSend.classList.remove('active');
    confirmSend.disabled = true;
  });

  // ADD EMAIL FIELD
  addEmailBtn.addEventListener('click', () => {
    const div = document.createElement('div');
    div.classList.add('email-field');
    div.innerHTML = '<input type="email" placeholder="Skriv inn epost" class="email-input">';
    emailContainer.appendChild(div);
    setupEmailValidation(div.querySelector('input'));
  });

  // VALIDERING AV EMAIL
  function setupEmailValidation(input){
    input.addEventListener('input', () => {
      const allEmails = document.querySelectorAll('.email-input');
      let valid = Array.from(allEmails).every(i => i.value === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(i.value));
      confirmSend.disabled = !valid || Array.from(allEmails).every(i => i.value === '');
      if(valid && !confirmSend.disabled) confirmSend.classList.add('active');
      else confirmSend.classList.remove('active');
    });
  }

  document.querySelectorAll('.email-input').forEach(i => setupEmailValidation(i));
});
