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
      const bases = [];
      if (app.constants.API_BASE) bases.push(app.constants.API_BASE.replace(/\/$/, ""));
      bases.push("");
      if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
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
