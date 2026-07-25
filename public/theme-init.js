/**
 * Early theme boot (same-origin). Kept out of index.html so CSP can use
 * script-src 'self' without 'unsafe-inline' / nonces (M-01).
 */
(function () {
  var k = "cad-theme-preference";
  var v = localStorage.getItem(k);
  var dark =
    v === "dark"
      ? true
      : v === "light"
        ? false
        : window.matchMedia("(prefers-color-scheme: dark)").matches;
  document.documentElement.classList.toggle("dark", dark);
  document.documentElement.style.colorScheme = dark ? "dark" : "light";
})();
