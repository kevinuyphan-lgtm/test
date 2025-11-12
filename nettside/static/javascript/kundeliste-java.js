document.addEventListener("DOMContentLoaded", function() {
    // 🔍 Søkefunksjon
    const searchInput = document.getElementById("searchInput");
    const table = document.getElementById("kundeTable");
    searchInput.addEventListener("keyup", function() {
        const filter = searchInput.value.toLowerCase();
        const rows = table.getElementsByTagName("tr");
        for (let i = 1; i < rows.length; i++) {
            const rowText = rows[i].innerText.toLowerCase();
            rows[i].style.display = rowText.includes(filter) ? "" : "none";
        }
    });

    // ✏️ Popup-funksjon
    const popup = document.getElementById("popup");
    const closePopup = document.getElementById("closePopup");
    const editIcons = document.querySelectorAll(".edit-icon");

    editIcons.forEach(icon => {
        icon.addEventListener("click", () => {
            document.getElementById("popupNavn").innerText = icon.dataset.navn;
            document.getElementById("popupFirma").innerText = icon.dataset.firma;
            document.getElementById("popupAdresse").innerText = icon.dataset.adresse;
            document.getElementById("popupOrgnr").innerText = icon.dataset.orgnr;
            document.getElementById("popupReferanse").innerText = icon.dataset.referanse;
            document.getElementById("popupTelefon").innerText = icon.dataset.telefon;
            document.getElementById("popupEpost").innerText = icon.dataset.epost;

            popup.style.display = "flex";
        });
    });

    closePopup.addEventListener("click", () => popup.style.display = "none");
    popup.addEventListener("click", (e) => {
        if (e.target === popup) popup.style.display = "none";
    });
});