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
