// DUE DATE OG SÅNT ----------------------------------------------------------------------
    // Dynamisk forfallsdato
    const invoiceDateInput = document.getElementById('invoice_date');
    const forfallsDagerInput = document.getElementById('forfalls_dager');
    const dueDateDisplay = document.getElementById('due_date_display');
    const dueDateHidden = document.getElementById('due_date');

    function updateDueDate() {
        const invoiceDate = new Date(invoiceDateInput.value);
        const days = parseInt(forfallsDagerInput.value) || 0;
        if (!isNaN(invoiceDate.getTime())) {
            invoiceDate.setDate(invoiceDate.getDate() + days);
            const yyyy = invoiceDate.getFullYear();
            const mm = String(invoiceDate.getMonth() + 1).padStart(2, '0');
            const dd = String(invoiceDate.getDate()).padStart(2, '0');
            const formattedDate = `${yyyy}-${mm}-${dd}`;
            dueDateDisplay.value = formattedDate;
            dueDateHidden.value = formattedDate;
        } else {
            dueDateDisplay.value = '';
            dueDateHidden.value = '';
        }
    }

    invoiceDateInput.addEventListener('change', updateDueDate);
    forfallsDagerInput.addEventListener('input', updateDueDate);
