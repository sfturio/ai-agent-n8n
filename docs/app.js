function setTheme(theme) {
  const isDark = theme === "dark";
  document.body.classList.toggle("theme-dark", isDark);
  localStorage.setItem("docs-theme", theme);
}

function initTheme() {
  const saved = localStorage.getItem("docs-theme");
  setTheme(saved === "light" ? "light" : "dark");
}

function initCopyButtons() {
  document.querySelectorAll(".copy-btn").forEach((button) => {
    button.addEventListener("click", async () => {
      const block = button.nextElementSibling;
      if (!block) return;

      const original = button.textContent;
      try {
        await navigator.clipboard.writeText(block.textContent || "");
        button.textContent = "Copied";
      } catch {
        button.textContent = "Failed";
      }

      setTimeout(() => {
        button.textContent = original;
      }, 1200);
    });
  });
}

window.addEventListener("DOMContentLoaded", () => {
  initTheme();
  initCopyButtons();

  const toggle = document.getElementById("themeToggle");
  if (!toggle) return;

  toggle.addEventListener("click", () => {
    const next = document.body.classList.contains("theme-dark") ? "light" : "dark";
    setTheme(next);
  });
});
