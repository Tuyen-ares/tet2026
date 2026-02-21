(() => {
  const app = window.TetApp;

  app.effects = {
    _timeouts: new Set(),
    _quality: "normal",
    _qualityLock: false,
    _fpsMonitorStarted: false,

    prefersReducedMotion() {
      return window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches === true;
    },

    isWeakMobileDevice() {
      const touch = window.matchMedia?.("(pointer: coarse)")?.matches === true;
      const cores = navigator.hardwareConcurrency || 8;
      const memory = navigator.deviceMemory || 8;
      return touch && (cores <= 4 || memory <= 4);
    },

    setQuality(next) {
      if (this._quality === next) return;
      this._quality = next;
      document.body.classList.toggle("low-fx", next === "low");
    },

    startFpsMonitor() {
      if (this._fpsMonitorStarted) return;
      this._fpsMonitorStarted = true;
      if (this.isWeakMobileDevice()) {
        this._qualityLock = true;
        this.setQuality("low");
        return;
      }

      let last = performance.now();
      let frames = 0;
      let acc = 0;
      const sampleFrames = 40;
      const tick = (now) => {
        const delta = now - last;
        last = now;
        if (delta > 0) {
          acc += 1000 / delta;
          frames += 1;
        }
        if (frames >= sampleFrames) {
          const fps = acc / frames;
          if (!this._qualityLock) this.setQuality(fps < 46 ? "low" : "normal");
          acc = 0;
          frames = 0;
        }
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    },

    density() {
      const qualityScale = this._quality === "low" ? 0.68 : 1;
      const ratio = window.innerWidth / 1280;
      return Math.max(0.5, Math.min(1, ratio * qualityScale));
    },

    schedule(fn, delay) {
      const id = setTimeout(() => {
        this._timeouts.delete(id);
        fn();
      }, delay);
      this._timeouts.add(id);
      return id;
    },

    clearScheduled() {
      this._timeouts.forEach((id) => clearTimeout(id));
      this._timeouts.clear();
    },

    triggerEffects(targetLayer) {
      if (!targetLayer) return;
      targetLayer.textContent = "";
      const width = window.innerWidth;
      const height = window.innerHeight;
      const density = this.density();
      const frag = document.createDocumentFragment();
      const heartCount = Math.max(6, Math.round(10 * density));
      const burstCount = Math.max(4, Math.round(6 * density));
      const iconCount = Math.max(3, Math.round(4 * density));

      for (let i = 0; i < heartCount; i += 1) {
        const heart = document.createElement("div");
        heart.className = "heart";
        heart.style.left = `${Math.random() * width}px`;
        heart.style.top = `${height * 0.6 + Math.random() * height * 0.3}px`;
        heart.style.animationDelay = `${Math.random() * 0.6}s`;
        frag.appendChild(heart);
      }

      for (let i = 0; i < burstCount; i += 1) {
        const burst = document.createElement("div");
        burst.className = "burst";
        burst.style.left = `${Math.random() * width}px`;
        burst.style.top = `${Math.random() * height * 0.5 + 40}px`;
        burst.style.animationDelay = `${Math.random() * 0.4}s`;
        frag.appendChild(burst);
      }

      for (let i = 0; i < iconCount; i += 1) {
        const icon = document.createElement("div");
        icon.className = "firework-icon";
        icon.style.left = `${Math.random() * width}px`;
        icon.style.top = `${Math.random() * height * 0.5 + 20}px`;
        icon.style.animationDelay = `${Math.random() * 0.4}s`;
        frag.appendChild(icon);

        const sparks = Math.max(6, Math.round(8 * density));
        const baseDelay = 300 + Math.random() * 300;
        this.schedule(() => {
          const sparksFrag = document.createDocumentFragment();
          for (let j = 0; j < sparks; j += 1) {
            const spark = document.createElement("div");
            spark.className = "spark";
            const angle = (Math.PI * 2 * j) / sparks;
            const distance = 60 + Math.random() * 40;
            spark.style.left = icon.style.left;
            spark.style.top = icon.style.top;
            spark.style.setProperty("--spark-x", `${Math.cos(angle) * distance}px`);
            spark.style.setProperty("--spark-y", `${Math.sin(angle) * distance}px`);
            sparksFrag.appendChild(spark);
            this.schedule(() => spark.remove(), 1500);
          }
          targetLayer.appendChild(sparksFrag);
        }, baseDelay);
      }

      targetLayer.appendChild(frag);
      this.schedule(() => {
        targetLayer.textContent = "";
      }, 3800);
    },

    triggerLanterns(targetLayer, count = 6) {
      if (!targetLayer) return;
      const width = window.innerWidth;
      const height = window.innerHeight;
      const frag = document.createDocumentFragment();

      for (let i = 0; i < count; i += 1) {
        const lantern = document.createElement("div");
        lantern.className = "lantern";
        lantern.style.left = `${Math.random() * width}px`;
        lantern.style.top = `${height + 20 + Math.random() * 40}px`;
        lantern.style.setProperty("--lantern-distance", `${-(height * (0.6 + Math.random() * 0.4))}px`);
        lantern.style.setProperty("--lantern-duration", `${6000 + Math.random() * 6000}ms`);
        lantern.style.setProperty("--lantern-sway", `${2 + Math.random() * 2}s`);

        const frame = document.createElement("div");
        frame.className = "lantern-frame";
        const body = document.createElement("div");
        body.className = "lantern-body";
        const flame = document.createElement("div");
        flame.className = "lantern-flame";

        lantern.appendChild(frame);
        lantern.appendChild(body);
        lantern.appendChild(flame);
        frag.appendChild(lantern);

        const lifetime = 12200;
        this.schedule(() => lantern.remove(), lifetime);
      }

      targetLayer.appendChild(frag);
    },

    triggerNameFireworks(targetLayer, name) {
      if (!targetLayer) return;
      const width = window.innerWidth;
      const height = window.innerHeight;
      const density = this.density();
      const safeName = (name || "").trim() || "Yêu";
      const headerY = height * 0.15 + 30;
      const iconCount = Math.max(2, Math.round(3 * density));
      const frag = document.createDocumentFragment();

      for (let i = 0; i < iconCount; i += 1) {
        const icon = document.createElement("div");
        icon.className = "firework-icon";
        icon.style.left = `${Math.random() * width}px`;
        icon.style.top = `${headerY + Math.random() * 40}px`;
        icon.style.animationDelay = `${0.2 + i * 0.3}s`;
        frag.appendChild(icon);

        const sparks = Math.max(7, Math.round(9 * density));
        const baseDelay = 400 + i * 220;
        this.schedule(() => {
          const particleFrag = document.createDocumentFragment();
          for (let j = 0; j < sparks; j += 1) {
            const particle = document.createElement("div");
            particle.className = "name-particle";
            particle.textContent = safeName;
            const angle = (Math.PI * 2 * j) / sparks;
            const distance = 90 + Math.random() * 50;
            particle.style.left = icon.style.left;
            particle.style.top = icon.style.top;
            particle.style.setProperty("--spark-x", `${Math.cos(angle) * distance}px`);
            particle.style.setProperty("--spark-y", `${Math.sin(angle) * distance}px`);
            particleFrag.appendChild(particle);
            this.schedule(() => particle.remove(), 1700);
          }
          targetLayer.appendChild(particleFrag);
        }, baseDelay);
      }

      targetLayer.appendChild(frag);
    },

    triggerNameFall(targetLayer, name) {
      if (!targetLayer) return;
      const width = window.innerWidth;
      const height = window.innerHeight;
      const density = this.density();
      const safeName = (name || "").trim() || "Yêu";
      const headerY = height * 0.15 + 40;
      const count = Math.max(7, Math.round(10 * density));
      const frag = document.createDocumentFragment();

      for (let i = 0; i < count; i += 1) {
        const fall = document.createElement("div");
        fall.className = "name-fall";
        fall.textContent = safeName;
        fall.style.left = `${Math.random() * width}px`;
        fall.style.top = `${headerY}px`;
        fall.style.setProperty("--fall-x", `${(Math.random() - 0.5) * 140}px`);
        fall.style.setProperty("--fall-y", `${height * 0.6 + Math.random() * 140}px`);
        fall.style.animationDelay = `${Math.random() * 0.4}s`;
        frag.appendChild(fall);
        this.schedule(() => fall.remove(), 3600);
      }

      targetLayer.appendChild(frag);
    },

    startContinuousEffects(targetLayer, name, createdAt, viewType = "basic") {
      this.startFpsMonitor();
      this.stopContinuousEffects();
      if (!targetLayer) return;
      if (this.prefersReducedMotion() || viewType === "builder" || viewType === "preview") {
        targetLayer.textContent = "";
        return;
      }

      const runCycle = () => {
        if (document.hidden) return;
        const remaining = app.constants.EXPIRY_MS - (Date.now() - createdAt);
        if (remaining <= 0) {
          this.stopContinuousEffects();
          return;
        }

        if (viewType === "basic") {
          this.triggerLanterns(targetLayer, Math.max(4, Math.round(5 * this.density())));
        } else {
          this.triggerEffects(targetLayer);
          this.triggerNameFireworks(targetLayer, name);
          this.triggerNameFall(targetLayer, name);
        }
      };

      runCycle();
      app.state.effectsTimer = setInterval(runCycle, 5000);
    },

    stopContinuousEffects() {
      if (app.state.effectsTimer) {
        clearInterval(app.state.effectsTimer);
        app.state.effectsTimer = null;
      }
      this.clearScheduled();
    },
  };
})();
