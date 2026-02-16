(() => {
  const app = window.TetApp;

  app.api = {
    buildShareUrl(id) {
      const url = new URL(window.location.href);
      url.hash = "";
      url.search = "";
      url.searchParams.set("id", id);
      return url.toString();
    },

    getApiBases() {
      const isLocalHost =
        window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
      const isGithubPagesHost = window.location.hostname.endsWith("github.io");
      const bases = [];

      let configuredBase = app.constants.API_BASE ? app.constants.API_BASE.replace(/\/$/, "") : "";
      // Auto-heal legacy Render domain that points to the wrong service.
      if (configuredBase === "https://tet2026.onrender.com") {
        configuredBase = "https://tet2026-wm4l.onrender.com";
      }
      if (configuredBase) bases.push(configuredBase);

      // Do not use same-origin API on GitHub Pages because it is static hosting.
      if (!isGithubPagesHost) bases.push("");

      // Safety fallback for GitHub Pages when config.js is stale/cached.
      // Keep the currently active backend URL here so API calls still work.
      if (isGithubPagesHost) {
        bases.push("https://tet2026-wm4l.onrender.com");
      }

      if (isLocalHost) {
        bases.push("http://localhost:3000");
      }

      return [...new Set(bases)];
    },

    async requestJsonFromAnyApiBase(path, options = {}) {
      const bases = this.getApiBases();
      let lastError = null;

      for (const base of bases) {
        const url = `${base}${path}`;
        try {
          const response = await fetch(url, options);
          if (!response.ok) {
            lastError = new Error(`HTTP ${response.status} at ${url}`);
            continue;
          }

          const contentType = (response.headers.get("content-type") || "").toLowerCase();
          if (!contentType.includes("application/json")) {
            lastError = new Error(`Non-JSON response at ${url}`);
            continue;
          }

          return await response.json();
        } catch (error) {
          lastError = error;
        }
      }

      throw lastError || new Error("No API base available.");
    },
  };
})();
