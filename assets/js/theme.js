const themes = ["github-dark", "tokyonight", "gruvbox"];
let current = 0;

function setTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("theme", theme);
}

function toggleTheme() {
  current = (current + 1) % themes.length;
  setTheme(themes[current]);
}

// Load saved theme
const saved = localStorage.getItem("theme");
if (saved) {
  setTheme(saved);
  current = themes.indexOf(saved);
}

