(() => {
  const app = (window.TetApp = window.TetApp || {});

  app.constants = {
    EXPIRY_MS: 20 * 60 * 1000,
    baseSegments: ["1.000đ", "2.000đ", "3.000đ", "5.000đ", "8.000đ", "10.000đ"],
    segmentColors: ["#d32f2f", "#f9a825", "#c62828", "#f57c00", "#b71c1c", "#ffb300"],
    DEFAULT_WISH:
      "Năm mới mở ra một hành trình mới, mong {name} luôn đủ mạnh mẽ để theo đuổi điều mình tin, đủ dịu dàng để giữ lại những điều đẹp nhất và đủ may mắn để hạnh phúc luôn ở cạnh.",
    API_BASE: (typeof window !== "undefined" && window.__API_BASE__) || "",
  };

  app.state = {
    segments: [...app.constants.baseSegments],
    currentAngle: 0,
    spinning: false,
    currentCardId: null,
    currentReceiverName: "",
    currentViewType: "basic",
    hasSpun: false,
    prizeAmount: null,
    countdownTimer: null,
    currentMin: 1000,
    currentMax: 10000,
    lastActiveIndex: null,
    effectsTimer: null,
    hasRedirectedToThankYou: false,
    view: {
      cardSection: null,
      greeting: null,
      cardTitle: null,
      subGreeting: null,
      wishText: null,
      expireNotice: null,
      expiredBox: null,
      spinBtn: null,
      spinResult: null,
      canvas: null,
      ctx: null,
      loveAudio: null,
    },
  };

  app.dom = {
    builderSection: document.getElementById("builder"),
    linkForm: document.getElementById("linkForm"),
    effectsLayer: document.getElementById("effects"),
    effectsBuilder: document.getElementById("effectsBuilder"),
    audioOverlay: document.getElementById("audioOverlay"),
    senderPronounInput: document.getElementById("senderPronoun"),
    receiverPronounInput: document.getElementById("receiverPronoun"),
    pageEyebrow: document.querySelector(".eyebrow"),
    pageTitle: document.querySelector(".display-title"),
    pageLead: document.querySelector(".lead"),
  };

  app.defaultHeader = {
    eyebrow: app.dom.pageEyebrow ? app.dom.pageEyebrow.textContent : "",
    title: app.dom.pageTitle ? app.dom.pageTitle.textContent : "",
    lead: app.dom.pageLead ? app.dom.pageLead.textContent : "",
  };

  app.utils = {
    formatVnd(value) {
      return `${value.toLocaleString("vi-VN")}đ`;
    },

    normalizeMinMax(min, max) {
      const safeMin = Math.max(1000, Math.floor(min / 1000) * 1000);
      const safeMax = Math.max(safeMin, Math.floor(max / 1000) * 1000);
      return { safeMin, safeMax };
    },

    randomVnd(min, max) {
      const { safeMin, safeMax } = this.normalizeMinMax(min, max);
      const steps = Math.floor((safeMax - safeMin) / 1000);
      const pick = safeMin + Math.floor(Math.random() * (steps + 1)) * 1000;
      return pick;
    },

    truncateText(text, limit = 180) {
      const clean = String(text || "").trim().replace(/\s+/g, " ");
      if (clean.length <= limit) return clean;
      return `${clean.slice(0, limit).trim()}...`;
    },

    formatTypeLabel(type) {
      if (type === "confess") return "Tình yêu";
      if (type === "lucky") return "Lì xì";
      return "Chúc Tết";
    },

    applyBuilderHeader() {
      document.body.classList.remove("receiver-mode");
      if (app.dom.pageEyebrow) app.dom.pageEyebrow.textContent = app.defaultHeader.eyebrow;
      if (app.dom.pageTitle) app.dom.pageTitle.textContent = app.defaultHeader.title;
      if (app.dom.pageLead) app.dom.pageLead.textContent = app.defaultHeader.lead;
    },

    showInvalidLinkNotice() {
      if (!app.dom.pageLead) return;
      app.dom.pageLead.textContent = "Link không hợp lệ, đã hết hạn, hoặc backend chưa truy cập được. Hãy tạo link mới.";
    },

    redirectToThankYou(name) {
      if (app.state.hasRedirectedToThankYou) return;
      app.state.hasRedirectedToThankYou = true;
      const url = new URL("thank-you.html", document.baseURI);
      url.searchParams.set("name", (name || "").trim());
      window.location.href = url.toString();
    },

    applyReceiverHeader({ name, title, type, sender, receiver }) {
      document.body.classList.add("receiver-mode");
      if (app.dom.pageEyebrow) {
        app.dom.pageEyebrow.textContent = `${this.formatTypeLabel(type)} • Lời chúc dành cho ${name}`;
      }
      if (app.dom.pageTitle) {
        app.dom.pageTitle.textContent = title || `Chúc mừng năm mới, ${name}`;
      }
      if (app.dom.pageLead) {
        const senderText = (sender || "Người gửi").trim();
        const receiverText = (receiver || "người nhận").trim();
        app.dom.pageLead.innerHTML = "";

        const line = document.createElement("span");
        line.className = "heart-text";
        line.textContent = `${senderText} gửi ${receiverText} ${name} lời chúc đầu năm an lành và đầy yêu thương.`;

        app.dom.pageLead.appendChild(line);
      }
    },

    updateHeaderLine(name, sender, receiver) {
      const cleanSender = (sender || "Người gửi").toLowerCase();
      const cleanReceiver = (receiver || "người nhận").toLowerCase();
      if (app.state.view.subGreeting) {
        app.state.view.subGreeting.textContent = `${cleanSender} mong ${cleanReceiver} ${name || ""} luôn rực rỡ, bình an và tràn ngập yêu thương.`;
      }
    },
  };
})();
