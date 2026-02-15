(() => {
  const app = window.TetApp;

  app.effects = {
    triggerEffects(targetLayer) {
      if (!targetLayer) return;
      targetLayer.innerHTML = "";
      const width = window.innerWidth;
      const height = window.innerHeight;

      for (let i = 0; i < 12; i += 1) {
        const heart = document.createElement("div");
        heart.className = "heart";
        heart.style.left = `${Math.random() * width}px`;
        heart.style.top = `${height * 0.6 + Math.random() * height * 0.3}px`;
        heart.style.animationDelay = `${Math.random() * 0.6}s`;
        targetLayer.appendChild(heart);
      }

      for (let i = 0; i < 8; i += 1) {
        const burst = document.createElement("div");
        burst.className = "burst";
        burst.style.left = `${Math.random() * width}px`;
        burst.style.top = `${Math.random() * height * 0.5 + 40}px`;
        burst.style.animationDelay = `${Math.random() * 0.4}s`;
        targetLayer.appendChild(burst);
      }

      for (let i = 0; i < 6; i += 1) {
        const icon = document.createElement("div");
        icon.className = "firework-icon";
        icon.style.left = `${Math.random() * width}px`;
        icon.style.top = `${Math.random() * height * 0.5 + 20}px`;
        icon.style.animationDelay = `${Math.random() * 0.4}s`;
        targetLayer.appendChild(icon);

        const sparks = 8;
        const baseDelay = 300 + Math.random() * 300;
        setTimeout(() => {
          for (let j = 0; j < sparks; j += 1) {
            const spark = document.createElement("div");
            spark.className = "spark";
            const angle = (Math.PI * 2 * j) / sparks;
            const distance = 60 + Math.random() * 40;
            spark.style.left = icon.style.left;
            spark.style.top = icon.style.top;
            spark.style.setProperty("--spark-x", `${Math.cos(angle) * distance}px`);
            spark.style.setProperty("--spark-y", `${Math.sin(angle) * distance}px`);
            targetLayer.appendChild(spark);
            setTimeout(() => spark.remove(), 1500);
          }
        }, baseDelay);
      }

      setTimeout(() => {
        targetLayer.innerHTML = "";
      }, 4200);
    },

    triggerLanterns(targetLayer, count = 6) {
      if (!targetLayer) return;
      const width = window.innerWidth;
      const height = window.innerHeight;

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
        targetLayer.appendChild(lantern);

        const lifetime = 12200;
        setTimeout(() => lantern.remove(), lifetime);
      }
    },

    triggerNameFireworks(targetLayer, name) {
      if (!targetLayer) return;
      const width = window.innerWidth;
      const height = window.innerHeight;
      const safeName = (name || "").trim() || "Yêu";
      const headerY = height * 0.15 + 30;

      for (let i = 0; i < 3; i += 1) {
        const icon = document.createElement("div");
        icon.className = "firework-icon";
        icon.style.left = `${Math.random() * width}px`;
        icon.style.top = `${headerY + Math.random() * 40}px`;
        icon.style.animationDelay = `${0.2 + i * 0.3}s`;
        targetLayer.appendChild(icon);

        const sparks = 10;
        const baseDelay = 400 + i * 220;
        setTimeout(() => {
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
            targetLayer.appendChild(particle);
            setTimeout(() => particle.remove(), 1700);
          }
        }, baseDelay);
      }
    },

    triggerNameFall(targetLayer, name) {
      if (!targetLayer) return;
      const width = window.innerWidth;
      const height = window.innerHeight;
      const safeName = (name || "").trim() || "Yêu";
      const headerY = height * 0.15 + 40;

      for (let i = 0; i < 12; i += 1) {
        const fall = document.createElement("div");
        fall.className = "name-fall";
        fall.textContent = safeName;
        fall.style.left = `${Math.random() * width}px`;
        fall.style.top = `${headerY}px`;
        fall.style.setProperty("--fall-x", `${(Math.random() - 0.5) * 140}px`);
        fall.style.setProperty("--fall-y", `${height * 0.6 + Math.random() * 140}px`);
        fall.style.animationDelay = `${Math.random() * 0.4}s`;
        targetLayer.appendChild(fall);
        setTimeout(() => fall.remove(), 3600);
      }
    },

    startContinuousEffects(targetLayer, name, createdAt, viewType = "basic") {
      this.stopContinuousEffects();

      const runCycle = () => {
        const remaining = app.constants.EXPIRY_MS - (Date.now() - createdAt);
        if (remaining <= 0) {
          this.stopContinuousEffects();
          return;
        }

        if (viewType === "basic") {
          this.triggerLanterns(targetLayer, 6);
        } else {
          this.triggerEffects(targetLayer);
          this.triggerNameFireworks(targetLayer, name);
          this.triggerNameFall(targetLayer, name);
        }
      };

      runCycle();
      app.state.effectsTimer = setInterval(runCycle, 4500);
    },

    stopContinuousEffects() {
      if (app.state.effectsTimer) {
        clearInterval(app.state.effectsTimer);
        app.state.effectsTimer = null;
      }
    },
  };
})();
