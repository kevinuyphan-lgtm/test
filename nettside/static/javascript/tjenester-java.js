document.addEventListener('DOMContentLoaded', function() {
    const today = new Date();
    const dueDate = new Date();
    dueDate.setDate(today.getDate() + 14);

    const formatDate = (date) => date.toISOString().split('T')[0];
    document.getElementById('invoice_date').value = formatDate(today);
    document.getElementById('due_date').value = formatDate(dueDate);

    document.getElementById('leggTilProdukt').addEventListener('click', function() {
        const container = document.getElementById('produkter-container');
        const ny = document.createElement('div');
        ny.classList.add('produkt');
        ny.innerHTML = `
            <input type="text" name="produkt_navn[]" placeholder="Produktnavn" required>
            <input type="number" name="produkt_antall[]" placeholder="Antall" min="1" value="1" required>
            <input type="number" name="produkt_pris[]" placeholder="Pris" min="0" step="0.01" required>
            <button type="button" class="fjern">🗑</button>
        `;
        container.appendChild(ny);
        ny.querySelector('.fjern').addEventListener('click', () => ny.remove());
    });
});
document.addEventListener("DOMContentLoaded", function() {
  const dropdownButtons = document.querySelectorAll(".dropdown-btn");

  dropdownButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const parent = btn.closest(".sidebar-item");

      // Lukk andre dropdowns (valgfritt – kommenter ut hvis du vil ha flere åpne)
      document.querySelectorAll(".sidebar-item").forEach(item => {
        if (item !== parent) item.classList.remove("open");
      });

      // Toggle valgt dropdown
      parent.classList.toggle("open");
    });
  });
});


// DUE DATE OG SÅNT ----------------------------------------------------------------------

const kundeSelect = document.getElementById('kunde_select');
kundeSelect.addEventListener('change', function() {
    const selected = kundeSelect.options[kundeSelect.selectedIndex];
    document.getElementById('firmanavn').value = selected.value || '';
    document.getElementById('firmaadresse').value = selected.dataset.adresse || '';
    document.getElementById('orgnr').value = selected.dataset.orgnr || '';
    document.getElementById('referanse').value = selected.dataset.referanse || '';
});

// --- Sett dagens dato som fakturadato ---
const invoiceDateInput = document.getElementById('invoice_date');
const today = new Date().toISOString().split('T')[0];
invoiceDateInput.value = today;
invoiceDateInput.min = today;

// --- Oppdater forfallsdato basert på antall dager ---
const dueDateInput = document.getElementById('due_date');
const forfallsSelect = document.getElementById('forfalls_dager');

function updateDueDate() {
    const days = parseInt(forfallsSelect.value, 10);
    const invoiceDate = new Date(invoiceDateInput.value);
    const dueDate = new Date(invoiceDate);
    dueDate.setDate(dueDate.getDate() + days);
    dueDateInput.value = dueDate.toISOString().split('T')[0];
}

// Init
updateDueDate();

// Event listeners
invoiceDateInput.addEventListener('change', updateDueDate);
forfallsSelect.addEventListener('change', updateDueDate);
