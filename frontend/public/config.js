// Frontend runtime config: set the API base URL for the backend server.
// Local default: http://localhost:3000
// Deploy default: same origin (empty string)
if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
  window.__API_BASE__ = "http://localhost:3000";
} else {
  window.__API_BASE__ = "";
}
