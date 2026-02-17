(() => {
  const app = window.TetApp;
  const TAU = Math.PI * 2;

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
      const arc = TAU / app.state.segments.length;
      const normalized = (TAU - (angle % TAU) + (3 * Math.PI) / 2 + arc / 2) % TAU;
      return Math.floor(normalized / arc);
    },

    getStableIndex(cardId, prizeAmount) {
      const seed = `${cardId || ""}:${prizeAmount || 0}`;
      let hash = 0;
      for (let i = 0; i < seed.length; i += 1) {
        hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
      }
      return hash % app.state.segments.length;
    },

    getAngleForIndex(index) {
      const arc = TAU / app.state.segments.length;
      const c = (3 * Math.PI) / 2 + arc / 2;
      const normalized = index * arc + arc / 2;
      const angle = ((c - normalized) % TAU + TAU) % TAU;
      return angle;
    },

    setWheelAtPrize(prizeAmount, cardId) {
      if (prizeAmount == null || Number.isNaN(Number(prizeAmount))) return;
      const index = this.getStableIndex(cardId, prizeAmount);
      app.constants.baseSegments.forEach((label, idx) => {
        app.state.segments[idx] = label;
      });
      app.state.segments[index] = app.utils.formatVnd(Number(prizeAmount));
      app.state.currentAngle = this.getAngleForIndex(index);
      this.drawWheel(app.state.currentAngle);
    },

    renderFinalResult(prizeAmount) {
      const { spinResult } = app.state.view;
      if (!spinResult) return;
      const amountText = Number(prizeAmount || 0).toLocaleString("vi-VN");
      spinResult.textContent = `Chúc mừng bạn nhận được ${amountText} đồng`;
    },

    applySpunUi(prizeAmount, options = {}) {
      const { showFinalResult = true } = options;
      const { spinBtn, spinResult, canvas, ctx } = app.state.view;
      if (spinBtn) {
        spinBtn.disabled = true;
        spinBtn.textContent = "Đã quay";
      }
      if (spinResult) {
        if (showFinalResult) this.renderFinalResult(prizeAmount);
        else spinResult.textContent = "";
      }
      if (canvas && ctx) {
        this.setWheelAtPrize(prizeAmount, app.state.currentCardId);
      }
    },

    showLuckyEnvelope(prizeAmount, onRevealed) {
      const prev = document.getElementById("lixiOverlay");
      if (prev) prev.remove();

      const overlay = document.createElement("div");
      overlay.id = "lixiOverlay";
      overlay.className = "lixi-overlay";
      overlay.innerHTML = `
        <div class="lixi-backdrop"></div>
        <div class="lixi-card" role="dialog" aria-modal="true" aria-label="Lì xì">
          <div class="lixi-glow"></div>
          <div class="lixi-envelope">
            <div class="lixi-glitter"></div>
            <div class="lixi-pocket"></div>
            <div class="lixi-front-art">
              <div class="lixi-art-stamp">XUÂN<br />CÁT<br />TƯỜNG</div>
              <div class="lixi-art-medallion">福</div>
              <div class="lixi-art-cloud lixi-art-cloud-a"></div>
              <div class="lixi-art-cloud lixi-art-cloud-b"></div>
              <div class="lixi-art-calligraphy">Cung Chúc Tân Xuân</div>
              <div class="lixi-art-year">2026</div>
            </div>
            <div class="lixi-flap"></div>
            <button type="button" class="lixi-seal" aria-label="Mở bao lì xì">
              <div class="lixi-seal-text">MỞ BAO</div>
            </button>
            <div class="lixi-slip-wrap">
              <div class="lixi-slip">
                <div class="lixi-slip-tab">Kéo thiệp</div>
                <div class="lixi-slip-content">
                  <p class="lixi-amount">${app.utils.formatVnd(Number(prizeAmount || 0))}</p>
                  <p class="lixi-message">Chúc mừng ${app.state.currentReceiverName || "bạn"}! Chúc bạn năm 2026 an khang, phát tài phát lộc.</p>
                </div>
              </div>
            </div>
            <div class="lixi-instruction" aria-hidden="true"></div>
          </div>
        </div>
      `;
      document.body.appendChild(overlay);

      const slip = overlay.querySelector(".lixi-slip");
      const seal = overlay.querySelector(".lixi-seal");
      const instructionEl = overlay.querySelector(".lixi-instruction");
      let startY = 0;
      let dragging = false;
      let pull = 0;
      let ejected = false;
      let opened = false;
      let flyingSlip = null;
      const EJECT_THRESHOLD = 64;

      const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
      const setPull = (value) => {
        if (!opened || ejected) return;
        pull = clamp(value, 0, 190);
        if (slip) slip.style.setProperty("--pull", `${pull}px`);
        if (pull >= EJECT_THRESHOLD) {
          if (instructionEl) instructionEl.textContent = "Thả tay để rút thiệp";
        } else {
          if (instructionEl) instructionEl.textContent = "Kéo thiệp lên để nhận lộc";
        }
      };
      const ejectSlipToCenter = () => {
        if (!slip || flyingSlip) return;
        const rect = slip.getBoundingClientRect();
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        const slipCenterX = rect.left + rect.width / 2;
        const slipCenterY = rect.top + rect.height / 2;
        const deltaX = centerX - slipCenterX;
        const targetY = centerY - rect.height * 0.16;
        const deltaY = targetY - slipCenterY;

        flyingSlip = slip.cloneNode(true);
        flyingSlip.classList.add("lixi-slip-fly");
        flyingSlip.style.left = `${rect.left}px`;
        flyingSlip.style.top = `${rect.top}px`;
        flyingSlip.style.width = `${rect.width}px`;
        flyingSlip.style.height = `${rect.height}px`;
        overlay.appendChild(flyingSlip);
        slip.classList.add("is-hidden-after-eject");

        const finalizeReveal = () => {
          overlay.classList.add("is-revealed");
          if (instructionEl) instructionEl.textContent = "Chúc mừng năm mới";
          if (typeof onRevealed === "function") onRevealed();
        };

        if (typeof flyingSlip.animate !== "function") {
          flyingSlip.style.transform = `translate3d(${deltaX}px, ${deltaY}px, 0) rotate(0deg) scale(1.05)`;
          finalizeReveal();
          return;
        }

        const anim = flyingSlip.animate(
          [
            { transform: "translate3d(0, 0, 0) rotate(0deg) scale(1)" },
            { transform: `translate3d(${deltaX * 0.35}px, ${deltaY * 0.14}px, 0) rotate(-2deg) scale(1.03)`, offset: 0.28 },
            { transform: `translate3d(${deltaX * 0.68}px, ${deltaY * 0.52}px, 0) rotate(1deg) scale(1.07)`, offset: 0.62 },
            { transform: `translate3d(${deltaX}px, ${deltaY}px, 0) rotate(0deg) scale(1.1)` }
          ],
          {
            duration: 860,
            easing: "cubic-bezier(0.16, 0.88, 0.24, 1)",
            fill: "forwards"
          }
        );

        anim.addEventListener("finish", finalizeReveal);
      };
      const dismiss = () => {
        overlay.classList.remove("is-visible");
        setTimeout(() => overlay.remove(), 260);
      };

      requestAnimationFrame(() => overlay.classList.add("is-visible"));

      const onPointerMove = (event) => {
        if (!dragging) return;
        const y = event.clientY ?? event.touches?.[0]?.clientY ?? startY;
        setPull(startY - y);
      };
      const onPointerEnd = () => {
        if (!dragging) return;
        dragging = false;
        if (pull < EJECT_THRESHOLD) {
          setPull(0);
        } else {
          setPull(84);
          ejected = true;
          ejectSlipToCenter();
        }
      };
      const onPointerStart = (event) => {
        if (!opened || ejected) return;
        const y = event.clientY ?? event.touches?.[0]?.clientY;
        if (typeof y !== "number") return;
        event.preventDefault?.();
        dragging = true;
        startY = y + pull;
      };

      if (slip) {
        slip.addEventListener("mousedown", onPointerStart);
        slip.addEventListener("touchstart", onPointerStart, { passive: true });
      }
      document.addEventListener("mousemove", onPointerMove);
      document.addEventListener("touchmove", onPointerMove, { passive: true });
      document.addEventListener("mouseup", onPointerEnd);
      document.addEventListener("touchend", onPointerEnd);

      seal?.addEventListener("click", () => {
        if (opened) return;
        opened = true;
        overlay.classList.add("is-open");
        if (instructionEl) instructionEl.textContent = "Kéo thiệp lên để nhận lộc";
      });

      const cleanupAndDismiss = () => {
        document.removeEventListener("mousemove", onPointerMove);
        document.removeEventListener("touchmove", onPointerMove);
        document.removeEventListener("mouseup", onPointerEnd);
        document.removeEventListener("touchend", onPointerEnd);
        dismiss();
      };
      overlay.querySelector(".lixi-backdrop")?.addEventListener("click", cleanupAndDismiss);
    },

    async spinWheel() {
      const { spinBtn, spinResult, canvas, ctx } = app.state.view;
      if (app.state.spinning || !spinBtn) return;
      if (!app.state.currentCardId) return;
      if (app.state.hasSpun) {
        this.applySpunUi(app.state.prizeAmount || 0);
        return;
      }

      app.state.spinning = true;
      spinBtn.disabled = true;
      if (spinResult) spinResult.textContent = "Đang quay...";

      try {
        const result = await app.api.requestJsonFromAnyApiBase(
          `/api/spin/${encodeURIComponent(app.state.currentCardId)}`,
          { method: "POST" }
        );
        const prize = Number(result?.prize || 0);

        app.state.hasSpun = true;
        app.state.prizeAmount = prize;

        if (!canvas || !ctx) {
          this.applySpunUi(prize, { showFinalResult: Boolean(result?.alreadySpun) });
          if (!result?.alreadySpun) {
            this.showLuckyEnvelope(prize, () => this.renderFinalResult(prize));
          }
          app.state.spinning = false;
          return;
        }

        const targetIndex = this.getStableIndex(app.state.currentCardId, prize);
        const currentMod = ((app.state.currentAngle % TAU) + TAU) % TAU;
        const targetMod = this.getAngleForIndex(targetIndex);
        const delta = (targetMod - currentMod + TAU) % TAU;
        const startAngle = app.state.currentAngle;
        const targetAngle = startAngle + 4 * TAU + delta;
        const duration = result?.alreadySpun ? 300 : 2800;
        const startTime = performance.now();

        const animate = (time) => {
          const elapsed = time - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const ease = 1 - Math.pow(1 - progress, 3);
          app.state.currentAngle = startAngle + (targetAngle - startAngle) * ease;
          this.drawWheel(app.state.currentAngle);

          if (progress < 1) {
            requestAnimationFrame(animate);
            return;
          }

          this.applySpunUi(prize, { showFinalResult: Boolean(result?.alreadySpun) });
          if (!result?.alreadySpun) {
            this.showLuckyEnvelope(prize, () => this.renderFinalResult(prize));
          }
          app.state.spinning = false;
        };
        requestAnimationFrame(animate);
      } catch (error) {
        app.state.spinning = false;
        spinBtn.disabled = false;
        if (spinResult) spinResult.textContent = "Không quay được, thử lại sau.";
      }
    },

    syncFromState() {
      const { spinBtn, spinResult, canvas, ctx } = app.state.view;
      if (!spinBtn) return;

      if (app.state.hasSpun && app.state.prizeAmount != null) {
        this.applySpunUi(app.state.prizeAmount);
        return;
      }

      spinBtn.disabled = false;
      if (app.state.currentViewType === "confess") {
        spinBtn.textContent = "Gửi lời yêu";
      } else {
        spinBtn.textContent = "Quay lì xì";
      }

      if (spinResult) {
        spinResult.textContent =
          app.state.currentViewType === "confess"
            ? "Nhấn để hiện kết quả một lần duy nhất."
            : "Nhấn quay để nhận lộc đầu năm.";
      }

      if (canvas && ctx) {
        app.constants.baseSegments.forEach((label, idx) => {
          app.state.segments[idx] = label;
        });
        this.drawWheel(app.state.currentAngle);
      }
    },
  };
})();
