// lagret_fakturaer-java.js (erstatte hele filen)
document.addEventListener("DOMContentLoaded", () => {
  /* -------------------------
     Hent elementer
  ------------------------- */
  const invoiceGrid = document.getElementById("invoiceGrid");
  const searchInput = document.getElementById("invoiceSearch");
  const sortSelect = document.getElementById("sortSelect");
  const sendBtn = document.getElementById("sendSelected");

  const popup = document.getElementById("sendPopup");
  const emailContainer = document.getElementById("emailContainer");
  const addEmailBtn = document.getElementById("addEmail");
  const cancelSend = document.getElementById("cancelSend");
  const confirmSend = document.getElementById("confirmSend");

  if (!invoiceGrid) {
    console.error("invoiceGrid not found (id=invoiceGrid). JS abort.");
    return;
  }

  /* -------------------------
     Hjelpefunksjoner
  ------------------------- */
  const getCards = () => Array.from(invoiceGrid.querySelectorAll(".invoice-card"));
  const getCheckboxes = () => Array.from(invoiceGrid.querySelectorAll('input[name="faktura"]'));

  function updateSendButtonState() {
    const anyChecked = getCheckboxes().some(cb => cb.checked);
    if (anyChecked) {
      sendBtn.classList.add("active");
      sendBtn.disabled = false;
    } else {
      sendBtn.classList.remove("active");
      sendBtn.disabled = true;
    }
  }

  function createDownloadButtonIfMissing(card) {
    // If a download button already exists, skip
    if (card.querySelector(".download-btn")) return;

    const id = card.dataset.id || card.getAttribute("data-id") || "";
    const btn = document.createElement("a");
    btn.className = "download-btn";
    btn.href = `/download_faktura/${encodeURIComponent(id)}`; // assumes endpoint
    btn.title = "Last ned";
    btn.innerHTML = "⬇"; // you can replace with icon
    btn.style.cssText = "position:absolute; right:12px; bottom:12px; text-decoration:none; font-size:16px;";
    card.appendChild(btn);
  }

  /* -------------------------
     Init: legg til download-knapp og event listeners på cards
  ------------------------- */
  function initCards() {
    getCards().forEach(card => {
      // ensure dataset.name exists (fallback to h3 text)
      if (!card.dataset.name) {
        const title = card.querySelector("h3");
        card.dataset.name = title ? title.textContent.trim().toLowerCase() : "";
      }
      // ensure dataset.date exists (fallback try to read data-date attr or 0)
      if (!card.dataset.date) {
        card.dataset.date = card.getAttribute("data-date") || "0";
      }

      // add download if missing
      createDownloadButtonIfMissing(card);
    });

    // wire checkbox changes using delegation on grid
    invoiceGrid.addEventListener("change", (e) => {
      if (e.target && e.target.matches('input[name="faktura"]')) {
        updateSendButtonState();
      }
    });

    // initialize send button state
    updateSendButtonState();
  }

  initCards();

  /* -------------------------
     SEARCH (live)
  ------------------------- */
  if (searchInput) {
    let lastQuery = "";
    searchInput.addEventListener("input", () => {
      const q = searchInput.value.trim().toLowerCase();
      lastQuery = q;

      getCards().forEach(card => {
        const name = (card.dataset.name || "").toLowerCase();
        const matches = q === "" || name.includes(q);
        card.style.display = matches ? "flex" : "none";

        // animated highlight when match and query non-empty
        if (matches && q !== "") {
          card.classList.add("highlight");
          // remove highlight after animation
          setTimeout(() => card.classList.remove("highlight"), 700);
        } else {
          card.classList.remove("highlight");
        }
      });

      // after filtering, re-evaluate send button (some cards might be hidden)
      updateSendButtonState();
    });
  }

  /* -------------------------
     SORTERING
     - options: nameAsc (A–Å), dateNew (nyeste først), dateOld (eldste først)
  ------------------------- */
  if (sortSelect) {
    sortSelect.addEventListener("change", () => {
      const method = sortSelect.value;
      const cards = getCards().slice(); // copy

      cards.sort((a, b) => {
        if (method === "nameAsc" || method === "nameDesc") {
          const na = (a.dataset.name || "").toLowerCase();
          const nb = (b.dataset.name || "").toLowerCase();
          const cmp = na.localeCompare(nb);
          return method === "nameAsc" ? cmp : -cmp;
        } else if (method === "dateNew" || method === "dateOld") {
          // data-date expected to be numeric timestamp string
          const da = Number(a.dataset.date) || 0;
          const db = Number(b.dataset.date) || 0;
          return method === "dateNew" ? db - da : da - db;
        }
        return 0;
      });

      // re-append in sorted order (keeping hidden/shown states)
      cards.forEach(c => invoiceGrid.appendChild(c));
    });
  }

  /* -------------------------
     SEND BUTTON -> ÅPNE POPUP
  ------------------------- */
  if (sendBtn) {
    sendBtn.addEventListener("click", () => {
      if (sendBtn.disabled) return;
      // reset email inputs to single empty field
      emailContainer.innerHTML = `<div class="email-field"><input type="email" class="email-input" placeholder="Skriv inn e-postadresse"></div>`;
      confirmSend.disabled = true;
      confirmSend.classList.remove("active");
      popup.style.display = "flex";
      emailContainer.querySelector(".email-input").focus();
    });
  }

  /* -------------------------
     ADD EMAIL FIELD
  ------------------------- */
  if (addEmailBtn) {
    addEmailBtn.addEventListener("click", () => {
      const div = document.createElement("div");
      div.className = "email-field";
      div.innerHTML = `<input type="email" class="email-input" placeholder="Skriv inn e-postadresse">`;
      emailContainer.appendChild(div);
      div.querySelector(".email-input").focus();
    });
  }

  /* -------------------------
     CANCEL POPUP
  ------------------------- */
  if (cancelSend) {
    cancelSend.addEventListener("click", () => {
      popup.style.display = "none";
    });
  }

  /* -------------------------
     VALIDER EMAILS OG AKTIVER CONFIRM
  ------------------------- */
  function isValidEmail(email) {
    // simple but reasonable regex
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  }

  emailContainer.addEventListener("input", () => {
    const inputs = Array.from(emailContainer.querySelectorAll(".email-input"));
    const allFilled = inputs.length > 0 && inputs.every(i => i.value.trim() !== "");
    const allValid = inputs.every(i => isValidEmail(i.value));
    if (allFilled && allValid) {
      confirmSend.disabled = false;
      confirmSend.classList.add("active");
    } else {
      confirmSend.disabled = true;
      confirmSend.classList.remove("active");
    }
  });

  /* -------------------------
     CONFIRM SEND -> POST TO BACKEND
  ------------------------- */
  if (confirmSend) {
    confirmSend.addEventListener("click", async () => {
      if (confirmSend.disabled) return;

      // collect emails
      const emails = Array.from(emailContainer.querySelectorAll(".email-input"))
        .map(i => i.value.trim())
        .filter(v => v.length);

      // collect selected invoice ids (only visible cards)
      const selected = getCheckboxes()
        .filter(cb => cb.checked && cb.closest(".invoice-card") && cb.closest(".invoice-card").style.display !== "none")
        .map(cb => cb.value);

      if (selected.length === 0) {
        alert("Velg minst én faktura før sending.");
        popup.style.display = "none";
        return;
      }

      // optional: show a loading state
      confirmSend.disabled = true;
      confirmSend.textContent = "Sender...";

      try {
        // POST to backend (adjust endpoint as needed)
        const res = await fetch("/send_faktura", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fakturaer: selected, emails })
        });

        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || `Server returnerte ${res.status}`);
        }

        // success
        popup.style.display = "none";
        alert("Fakturaene ble sendt!");
      } catch (err) {
        console.error("Send error:", err);
        alert("Klarte ikke sende fakturaene: " + (err.message || err));
      } finally {
        confirmSend.disabled = false;
        confirmSend.textContent = "Send";
      }
    });
  }

  /* -------------------------
     Keyboard shortcuts & close on overlay click
  ------------------------- */
  // close popup on ESC
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      popup.style.display = "none";
    }
  });

  // click outside popup to close
  popup.addEventListener("click", (e) => {
    if (e.target === popup) popup.style.display = "none";
  });

  /* -------------------------
     Observe mutations (if cards are dynamically changed)
     re-run init for download buttons
  ------------------------- */
  const mo = new MutationObserver(() => {
    initCards(); // re-create any missing download buttons, etc.
  });
  mo.observe(invoiceGrid, { childList: true, subtree: true });

  /* -------------------------
     Utility: initCards (reused here)
  ------------------------- */
  function initCards() {
    getCards().forEach(card => {
      // ensure dataset.name exists
      if (!card.dataset.name) {
        const title = card.querySelector("h3");
        card.dataset.name = title ? title.textContent.trim().toLowerCase() : "";
      }
      if (!card.dataset.date) {
        const attr = card.getAttribute("data-date");
        card.dataset.date = attr ? attr : "0";
      }
      createDownloadButtonIfMissing(card);
    });
  }

  // helper already declared earlier, but redeclare safe versions for scope
  function createDownloadButtonIfMissing(card) {
    if (card.querySelector(".download-btn")) return;
    const id = card.dataset.id || card.getAttribute("data-id") || "";
    const a = document.createElement("a");
    a.className = "download-btn";
    a.href = `/download_faktura/${encodeURIComponent(id)}`; // change if your endpoint differs
    a.title = "Last ned";
    a.innerHTML = "⬇";
    a.style.cssText = "position:absolute; right:12px; bottom:12px; text-decoration:none; font-size:16px;";
    card.appendChild(a);
  }

  // Final init
  initCards();
  updateSendButtonState();
});
