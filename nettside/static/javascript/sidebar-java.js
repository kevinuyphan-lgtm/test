document.addEventListener('DOMContentLoaded', function() {

  // ===== DATOER =====
  const today = new Date();
  const dueDate = new Date();
  dueDate.setDate(today.getDate() + 14);

  const formatDate = (date) => date.toISOString().split('T')[0];
  document.getElementById('invoice_date').value = formatDate(today);
  document.getElementById('due_date').value = formatDate(dueDate);

  // ===== SIDEBAR DROPDOWN + ROTER PIL =====
  const toggles = document.querySelectorAll(".sidebar-toggle");

  toggles.forEach(btn => {
    btn.addEventListener("click", () => {
      const parent = btn.closest(".sidebar-group");

      document.querySelectorAll(".sidebar-group").forEach(group => {
        if (group !== parent) group.classList.remove("open");
      });

      parent.classList.toggle("open");
    });
  });

  // ===== PRODUKTER + TOTALSUM =====
  const container = document.getElementById('produkter-container');
  const addBtn = document.getElementById('leggTilProdukt');
  const totalField = document.getElementById('totalbelop');

  function oppdaterTotal() {
    let total = 0;

    document.querySelectorAll('.produkt-row').forEach(row => {
      const antall = row.querySelector('input[name="produkt_antall[]"]').value || 0;
      const pris = row.querySelector('input[name="produkt_pris[]"]').value || 0;
      total += antall * pris;
    });

    totalField.textContent = total.toFixed(2) + " kr";
  }

  function leggTilProdukt() {
    const ny = document.createElement('div');
    ny.classList.add('produkt-row');

    ny.innerHTML = `
      <input type="text" name="produkt_navn[]" placeholder="Produktnavn" required>
      <input type="number" name="produkt_antall[]" min="1" value="1" required>
      <input type="number" name="produkt_pris[]" min="0" step="0.01" required>
      <button type="button" class="fjern">🗑</button>
    `;

    container.appendChild(ny);

    ny.querySelectorAll('input').forEach(input => {
      input.addEventListener('input', oppdaterTotal);
    });

    ny.querySelector('.fjern').addEventListener('click', () => {
      ny.remove();
      oppdaterTotal();
    });
  }

  addBtn.addEventListener('click', leggTilProdukt);
});
