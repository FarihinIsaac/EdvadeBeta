/**
 * Copy to config.production.js for split hosting (frontend and API on different domains).
 * Load it BEFORE config.js in your HTML, or replace config.js on the server.
 *
 * Example: backend on Render, frontend on Netlify
 */
window.EDVADE_API_BASE = "https://your-backend.onrender.com/api";
