const themes = [
  "terminal-classic",
  "github-dark",
  "github-light",
  "tokyonight",
];

function setTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("theme", theme);
}

function toggleTheme() {
  const current = localStorage.getItem("theme") || "terminal-classic";
  let index = themes.indexOf(current);
  if (index === -1) index = 0;

  const next = themes[(index + 1) % themes.length];
  setTheme(next);
}
