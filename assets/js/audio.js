(() => {
  const app = window.TetApp;

  app.audio = {
    setupAudio(audioUrl) {
      const loveAudio = app.state.view.loveAudio;
      if (!loveAudio) return;

      if (!audioUrl) {
        loveAudio.src = "";
        if (app.dom.audioOverlay) app.dom.audioOverlay.classList.add("d-none");
        return;
      }

      loveAudio.controls = false;
      loveAudio.preload = "auto";
      loveAudio.src = audioUrl;
      loveAudio.load();
      loveAudio.volume = 0.7;
      loveAudio.loop = true;
      loveAudio.autoplay = true;
      if (app.dom.audioOverlay) app.dom.audioOverlay.classList.remove("d-none");

      const tryPlay = () => {
        loveAudio.play().catch(() => {
          if (app.dom.audioOverlay) app.dom.audioOverlay.classList.remove("d-none");
        });
      };

      loveAudio.addEventListener("canplay", tryPlay, { once: true });
      setTimeout(tryPlay, 150);

      const handleUserInteract = () => {
        loveAudio.play().finally(() => {
          if (app.dom.audioOverlay) app.dom.audioOverlay.classList.add("d-none");
        });
      };

      document.addEventListener("click", handleUserInteract, { once: true });
      document.addEventListener("touchstart", handleUserInteract, { once: true });
      loveAudio.addEventListener("play", () => {
        if (app.dom.audioOverlay) app.dom.audioOverlay.classList.add("d-none");
      });
    },
  };
})();
