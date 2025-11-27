document.addEventListener('DOMContentLoaded', function() {

  // ===== SIDEBAR DROPDOWN =====
  const toggles = document.querySelectorAll(".sidebar-toggle");
  
  if(toggles.length > 0){
    toggles.forEach(btn => {
      btn.addEventListener("click", () => {
        const parent = btn.closest(".sidebar-group");
        
        // Lukk alle andre grupper
        document.querySelectorAll(".sidebar-group").forEach(group => {
          if (group !== parent) group.classList.remove("open");
        });
        
        // Toggle den som ble klikket
        parent.classList.toggle("open");
      });
    });
  }

  // ===== AKTIV SIDEBAR-LENKE =====
  const currentUrl = window.location.pathname;
  const sidebarLinks = document.querySelectorAll(".sidebar-link, .sidebar-submenu a");

  sidebarLinks.forEach(link => {
    if(link.getAttribute("href") === currentUrl){
      link.classList.add("active");

      const parentGroup = link.closest(".sidebar-group");
      if(parentGroup){
        parentGroup.classList.add("open");
        const toggle = parentGroup.querySelector(".sidebar-toggle");
        if(toggle) toggle.classList.add("active");
      }
    }
  });

});
