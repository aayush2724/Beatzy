// Applies the stored theme before first paint so a light-theme user never sees
// a dark flash while the bundle boots. Kept as an external file (not inline)
// so the Content-Security-Policy can stay `script-src 'self'`.
(function () {
  try {
    var t = localStorage.getItem('beatzy-theme') || 'dark';
    document.documentElement.setAttribute('data-theme', t);
  } catch (e) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
})();
