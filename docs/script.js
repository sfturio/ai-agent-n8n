function setLang(lang) {
  const sections = document.querySelectorAll("[data-lang]");

  sections.forEach(section => {
    if (section.getAttribute("data-lang") === lang) {
      section.classList.remove("hidden");
    } else {
      section.classList.add("hidden");
    }
  });
}