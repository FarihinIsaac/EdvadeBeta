/**
 * Edvade API base URL — loaded before auth.js on every page.
 *
 * Priority:
 * 1. window.EDVADE_API_BASE (set in config.production.js for split hosting)
 * 2. localStorage.API_BASE (manual override in browser console)
 * 3. <meta name="edvade-api-base" content="https://your-api.com/api">
 * 4. Local dev → http://localhost:3000/api
 * 5. Production → /api (same domain / reverse proxy)
 */
(function () {
  function normalize(url) {
    return String(url || "").replace(/\/+$/, "");
  }

  if (window.EDVADE_API_BASE) {
    window.API = normalize(window.EDVADE_API_BASE);
    return;
  }

  const stored = localStorage.getItem("API_BASE");
  if (stored) {
    window.API = normalize(stored);
    return;
  }

  const meta = document.querySelector('meta[name="edvade-api-base"]');
  if (meta && meta.content) {
    window.API = normalize(meta.content);
    return;
  }

  const isLocal =
    location.hostname === "localhost" || location.hostname === "127.0.0.1";

  window.API = isLocal
    ? `${location.protocol}//${location.hostname}:3000/api`
    : `${location.origin}/api`;
})();
