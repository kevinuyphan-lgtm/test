document.addEventListener("DOMContentLoaded", function() {

  // ===== SIDEBAR DROPDOWN =====
  const sidebarToggles = document.querySelectorAll(".sidebar-toggle");
  sidebarToggles.forEach(btn => {
    btn.addEventListener("click", () => {
      const parent = btn.closest(".sidebar-group");
      parent.classList.toggle("open");
    });
  });

  // ===== FAKTURA CHECKBOX + SEND KNAPP =====
  const sendSelectedBtn = document.getElementById('sendSelected');
  const sendPopup = document.getElementById('sendPopup');
  const cancelSend = document.getElementById('cancelSend');
  const confirmSend = document.getElementById('confirmSend');
  const emailContainer = document.getElementById('emailContainer');
  const addEmailBtn = document.getElementById('addEmail');

  function updateCheckboxes() {
    const fakturaCheckboxes = document.querySelectorAll('input[name="faktura"]');
    const anyChecked = Array.from(fakturaCheckboxes).some(cb => cb.checked);
    if(anyChecked){
      sendSelectedBtn.classList.add('active');
      sendSelectedBtn.disabled = false;
    } else {
      sendSelectedBtn.classList.remove('active');
      sendSelectedBtn.disabled = true;
    }
  }

  // Observer for å fange dynamiske checkboxer
  const observer = new MutationObserver(updateCheckboxes);
  observer.observe(document.querySelector('.faktura-container'), {childList: true, subtree: true});
  updateCheckboxes();

  // Event listener på checkboxer (delegation)
  document.querySelector('.faktura-container').addEventListener('change', e => {
    if(e.target && e.target.matches('input[name="faktura"]')) {
      updateCheckboxes();
    }
  });

  // Åpne popup
  sendSelectedBtn.addEventListener('click', () => {
    sendPopup.style.display = 'flex';
    confirmSend.disabled = true;
    confirmSend.classList.remove('active');
  });

  // Avbryt popup
  cancelSend.addEventListener('click', () => sendPopup.style.display = 'none');

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

  document.querySelectorAll('.email-input').forEach(input => setupEmailValidation(input));

  // ===== SIDEBAR ACTIVE LINK =====
  const currentUrl = window.location.pathname;
  document.querySelectorAll('.sidebar-submenu a').forEach(link => {
    if(link.getAttribute('href') === currentUrl){
      link.classList.add('active');
      link.closest('.sidebar-group').classList.add('open');
      link.closest('.sidebar-group').querySelector('.sidebar-toggle').classList.add('active');
    }
  });
});
