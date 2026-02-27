// app.js
function setTheme(theme) {
  const isDark = theme === "dark";
  document.body.classList.toggle("theme-dark", isDark);
  localStorage.setItem("theme", theme);
}

function initTheme() {
  const saved = localStorage.getItem("theme");
  if (saved === "light" || saved === "dark") {
    setTheme(saved);
  } else {
    setTheme("dark");
  }
}

function initCopyButtons() {
  document.querySelectorAll(".copy-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const pre = btn.nextElementSibling;
      if (!pre) return;

      try {
        await navigator.clipboard.writeText(pre.innerText);
        const old = btn.innerText;
        btn.innerText = "Copied";
        setTimeout(() => (btn.innerText = old), 1200);
      } catch (e) {
        const old = btn.innerText;
        btn.innerText = "Failed";
        setTimeout(() => (btn.innerText = old), 1200);
      }
    });
  });
}

window.addEventListener("DOMContentLoaded", () => {
  initTheme();
  initCopyButtons();

  const toggle = document.getElementById("themeToggle");
  if (toggle) {
    toggle.addEventListener("click", () => {
      const next = document.body.classList.contains("theme-dark")
        ? "light"
        : "dark";
      setTheme(next);
    });
  }
});
