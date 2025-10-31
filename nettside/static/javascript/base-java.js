var prevScrollpos = window.pageYOffset;
window.onscroll = function() {
  var currentScrollPos = window.pageYOffset;
  var navbar = document.getElementById("navbar");

  if (prevScrollpos > currentScrollPos) {
    navbar.style.top = "0"; // vis navbar
  } else {
    navbar.style.top = "-150px";
  }
  prevScrollpos = currentScrollPos;
}

var login = document.getElementById("Login");
window.onclick = function(event) {
  if (event.target == modal) {
    modal.style.display = "none";
  }
}