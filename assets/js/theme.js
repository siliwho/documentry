const themes = ["terminal-classic", "github-dark"];

function setTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("theme", theme);
}

function toggleTheme() {
  const current = localStorage.getItem("theme") || "terminal-classic";
  const next =
    current === "terminal-classic" ? "github-dark" : "terminal-classic";
  setTheme(next);
}
