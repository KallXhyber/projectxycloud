const hamburger = document.querySelector(".hamburger");
const navMenu = document.querySelector(".nav-menu");

hamburger.addEventListener("click", () => {
    // Toggle kelas 'active' pada hamburger dan nav menu
    hamburger.classList.toggle("active");
    navMenu.classList.toggle("active");
});

// Menutup menu jika user mengklik salah satu link
document.querySelectorAll(".nav-link").forEach(n => n.addEventListener("click", () => {
    hamburger.classList.remove("active");
    navMenu.classList.remove("active");
}));