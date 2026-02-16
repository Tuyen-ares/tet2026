// Frontend runtime config: set the API base URL for the backend server.
// Local: http://localhost:3000
// GitHub Pages: set your Render backend URL here.
const isLocalHost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
const isGithubPagesHost = window.location.hostname.endsWith("github.io");

if (isLocalHost) {
  window.__API_BASE__ = "http://localhost:3000";
} else if (isGithubPagesHost) {
  // IMPORTANT: replace with your actual Render backend URL.
  window.__API_BASE__ = "https://tet2026.onrender.com";
} else {
  // Same-origin for environments where frontend and backend share a domain.
  window.__API_BASE__ = "";
}
