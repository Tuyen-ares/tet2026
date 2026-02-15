(() => {
  const app = window.TetApp;

  app.views = {
    async loadViewFragment(type) {
      const root = document.getElementById("view-root");
      if (!root) return;

      try {
        let res = await fetch(`views/${type}.html`);
        if (!res.ok) {
          res = await fetch("views/basic.html");
          if (!res.ok) {
            root.innerHTML = '<div class="text-center p-4">Không tìm thấy view.</div>';
            return;
          }
        }

        root.innerHTML = await res.text();
        this.initViewElements();
      } catch (error) {
        root.innerHTML = '<div class="text-center p-4">Lỗi khi tải view.</div>';
      }
    },

    initViewElements() {
      app.state.view.cardSection = document.getElementById("card");
      app.state.view.greeting = document.getElementById("greeting");
      app.state.view.cardTitle = document.getElementById("cardTitle");
      app.state.view.subGreeting = document.getElementById("subGreeting");
      app.state.view.wishText = document.getElementById("wishText");
      app.state.view.expireNotice = document.getElementById("expireNotice");
      app.state.view.expiredBox = document.getElementById("expiredBox");
      app.state.view.spinBtn = document.getElementById("spinBtn");
      app.state.view.spinResult = document.getElementById("spinResult");
      app.state.view.canvas = document.getElementById("wheel");
      app.state.view.loveAudio = document.getElementById("loveAudio");

      if (app.state.view.canvas) {
        try {
          app.state.view.ctx = app.state.view.canvas.getContext("2d");
        } catch (error) {
          app.state.view.ctx = null;
        }
      } else {
        app.state.view.ctx = null;
      }

      if (app.state.view.spinBtn) {
        app.state.view.spinBtn.onclick = () => app.wheel.spinWheel();
      }

      if (app.state.view.canvas && app.state.view.ctx) {
        app.wheel.drawWheel(app.state.currentAngle);
      }
    },

    wireCopyButton() {
      const copyBtn = document.getElementById("copyBtn");
      if (!copyBtn) return;

      copyBtn.onclick = async () => {
        const linkOutput = document.getElementById("linkOutput");
        if (!linkOutput || !linkOutput.value) return;

        try {
          await navigator.clipboard.writeText(linkOutput.value);
          copyBtn.textContent = "Đã sao chép";
          setTimeout(() => {
            copyBtn.textContent = "Sao chép";
          }, 1500);
        } catch (error) {
          copyBtn.textContent = "Không sao chép được";
        }
      };
    },

    async loadComponent(name, targetId) {
      const root = document.getElementById(targetId);
      if (!root) return;

      try {
        const res = await fetch(`components/${name}.html`);
        if (!res.ok) return;
        root.innerHTML = await res.text();
        this.wireCopyButton();
      } catch (error) {
        // ignore
      }
    },
  };
})();
