// Applies the saved (or system) colour theme before the app renders, so the
// page never flashes the wrong theme. Kept as a file because the CSP blocks
// inline scripts.
(function () {
  var theme;
  try {
    theme = localStorage.getItem("terrace.theme");
  } catch (e) {}
  if (theme !== "light" && theme !== "dark") {
    theme = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  document.documentElement.dataset.theme = theme;
})();
