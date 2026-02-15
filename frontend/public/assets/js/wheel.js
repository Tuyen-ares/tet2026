(() => {
  const app = window.TetApp;

  app.wheel = {
    drawWheel(angle = 0) {
      const { canvas, ctx } = app.state.view;
      if (!canvas || !ctx) return;

      const size = canvas.width;
      const radius = size / 2;
      const arc = (2 * Math.PI) / app.state.segments.length;

      ctx.clearRect(0, 0, size, size);
      ctx.save();
      ctx.translate(radius, radius);
      ctx.rotate(angle);

      app.state.segments.forEach((label, index) => {
        const start = arc * index;
        const end = start + arc;

        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, radius - 6, start, end);
        ctx.closePath();
        ctx.fillStyle = app.constants.segmentColors[index % app.constants.segmentColors.length];
        ctx.fill();

        ctx.save();
        ctx.rotate(start + arc / 2);
        ctx.fillStyle = "#fff7ea";
        ctx.font = "600 16px 'Be Vietnam Pro'";
        ctx.textAlign = "right";
        ctx.fillText(label, radius - 18, 6);
        ctx.restore();
      });

      ctx.restore();
    },

    getSelectedIndex(angle) {
      const arc = (2 * Math.PI) / app.state.segments.length;
      const normalized =
        (2 * Math.PI - (angle % (2 * Math.PI)) + (3 * Math.PI) / 2 + arc / 2) % (2 * Math.PI);
      return Math.floor(normalized / arc);
    },

    finishSpin(angle) {
      const { spinBtn, spinResult } = app.state.view;
      const index = this.getSelectedIndex(angle);

      app.constants.baseSegments.forEach((label, idx) => {
        app.state.segments[idx] = label;
      });

      const jumpDuration = 600;
      const jumpInterval = 60;
      const jumpStart = Date.now();
      const jumpTimer = setInterval(() => {
        const randomValue = app.utils.randomVnd(app.state.currentMin, app.state.currentMax);
        app.state.segments[index] = app.utils.formatVnd(randomValue);
        this.drawWheel(app.state.currentAngle);
        if (spinResult) {
          spinResult.textContent = `Lì xì thực nhận: ${app.utils.formatVnd(randomValue)}`;
        }

        if (Date.now() - jumpStart > jumpDuration) {
          clearInterval(jumpTimer);
          const finalValue = app.utils.randomVnd(app.state.currentMin, app.state.currentMax);
          app.state.segments[index] = app.utils.formatVnd(finalValue);
          this.drawWheel(app.state.currentAngle);
          if (spinResult) {
            spinResult.textContent = `Lì xì thực nhận: ${app.utils.formatVnd(finalValue)}`;
          }
          app.state.spinning = false;
          if (spinBtn) spinBtn.disabled = false;
        }
      }, jumpInterval);
    },

    spinWheel() {
      const { spinBtn, spinResult, canvas, ctx } = app.state.view;
      if (app.state.spinning || !spinBtn) return;

      if (!canvas || !ctx) {
        const confessLines = [
          "Tớ thích cậu rất nhiều.",
          "Cảm ơn vì đã xuất hiện trong đời tớ.",
          "Chúc chúng ta luôn bên nhau bình yên.",
          "Tình cảm này là thật lòng.",
        ];
        spinBtn.disabled = true;
        if (spinResult) {
          spinResult.textContent = confessLines[Math.floor(Math.random() * confessLines.length)];
        }
        setTimeout(() => {
          spinBtn.disabled = false;
        }, 1200);
        return;
      }

      app.state.spinning = true;
      spinBtn.disabled = true;
      if (spinResult) spinResult.textContent = "Đang quay...";
      app.state.lastActiveIndex = null;

      app.constants.baseSegments.forEach((label, index) => {
        app.state.segments[index] = label;
      });

      const start = performance.now();
      const duration = 3600;
      const spins = 4 + Math.random() * 2;
      const startAngle = app.state.currentAngle;
      const targetAngle = startAngle + spins * Math.PI * 2 + Math.random() * Math.PI;

      const animate = (time) => {
        const elapsed = time - start;
        const progress = Math.min(elapsed / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 3);
        const angle = startAngle + (targetAngle - startAngle) * ease;
        app.state.currentAngle = angle;

        const activeIndex = this.getSelectedIndex(angle);
        if (app.state.lastActiveIndex !== null && app.state.lastActiveIndex !== activeIndex) {
          app.state.segments[app.state.lastActiveIndex] = app.constants.baseSegments[app.state.lastActiveIndex];
        }

        app.state.segments[activeIndex] = app.utils.formatVnd(
          app.utils.randomVnd(app.state.currentMin, app.state.currentMax)
        );

        app.state.lastActiveIndex = activeIndex;
        this.drawWheel(angle);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          this.finishSpin(angle);
        }
      };

      requestAnimationFrame(animate);
    },
  };
})();
