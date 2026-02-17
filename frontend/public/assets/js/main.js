(() => {
  const app = window.TetApp;

  const showBuilder = () => {
    app.utils.applyBuilderHeader();
    if (app.dom.builderSection) app.dom.builderSection.classList.remove("d-none");
    if (app.state.view.cardSection) app.state.view.cardSection.classList.add("d-none");
    app.effects.startContinuousEffects(app.dom.effectsBuilder, "Yêu", Date.now());
  };

  const showCard = (name, createdAt, wish, title, viewType = "basic") => {
    if (app.dom.builderSection) app.dom.builderSection.classList.add("d-none");
    if (app.state.view.cardSection) app.state.view.cardSection.classList.remove("d-none");
    if (app.state.view.greeting) app.state.view.greeting.textContent = `Chúc mừng năm mới, ${name}!`;
    if (app.state.view.cardTitle) app.state.view.cardTitle.textContent = title || "";
    if (app.state.view.wishText) app.state.view.wishText.textContent = wish;

    app.effects.startContinuousEffects(app.dom.effectsLayer, name, createdAt, viewType);
    if (app.wheel && typeof app.wheel.syncFromState === "function") {
      app.wheel.syncFromState();
    }

    const updateCountdown = () => {
      if (!app.state.view.expireNotice) return;
      const remaining = app.constants.EXPIRY_MS - (Date.now() - createdAt);

      if (remaining <= 0) {
        app.state.view.expireNotice.textContent = "Link đã hết hạn. Đang chuyển trang...";
        app.effects.stopContinuousEffects();
        if (app.state.countdownTimer) {
          clearInterval(app.state.countdownTimer);
          app.state.countdownTimer = null;
        }
        app.utils.redirectToThankYou(name);
        return;
      }

      const minutes = Math.floor(remaining / 60000);
      const seconds = Math.floor((remaining % 60000) / 1000);
      app.state.view.expireNotice.textContent = `Link còn hiệu lực: ${minutes
        .toString()
        .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    };

    updateCountdown();
    app.state.countdownTimer = setInterval(updateCountdown, 1000);
  };

  const getCardId = () => {
    const params = new URLSearchParams(window.location.search);
    const queryId = params.get("id");
    if (queryId) return queryId;

    const match = window.location.pathname.match(/\/c\/([^/]+)/);
    return match ? match[1] : null;
  };

  const parseLink = async () => {
    const cardId = getCardId();
    if (!cardId) {
      showBuilder();
      return;
    }

    try {
      const data = await app.api.requestJsonFromAnyApiBase(`/api/card/${encodeURIComponent(cardId)}`);
      if (data.expired) {
        app.utils.redirectToThankYou(data.name);
        return;
      }

      const wish =
        (data.wish ? data.wish : "").trim().replace(/{name}/gi, data.name) ||
        app.constants.DEFAULT_WISH.replace(/{name}/g, data.name);

      app.state.currentMin = data.min || 1000;
      app.state.currentMax = data.max || 10000;
      const viewType = data.type || "basic";
      app.state.currentCardId = data.id || cardId;
      app.state.currentReceiverName = data.name || "";
      app.state.currentViewType = viewType;
      app.state.hasSpun = !!data.hasSpun;
      app.state.prizeAmount = data.prizeAmount ?? null;

      await app.views.loadViewFragment(viewType);
      app.utils.applyReceiverHeader({
        name: data.name,
        title: data.title,
        wish,
        type: viewType,
        sender: data.sender,
        receiver: data.receiver,
      });
      app.utils.updateHeaderLine(data.name, data.sender, data.receiver);
      app.audio.setupAudio(data.audio);

      showCard(data.name, data.createdAt, wish, data.title, viewType);
    } catch (error) {
      showBuilder();
      app.utils.showInvalidLinkNotice();
    }
  };

  if (app.dom.linkForm) {
    app.dom.linkForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      const name = (document.getElementById("loverName") || {}).value?.trim();
      if (!name) return;

      const wishContent = (document.getElementById("wishContent") || {}).value?.trim() || "";
      const audioUrl = (document.getElementById("audioUrl") || {}).value?.trim() || "";
      const senderPronoun = app.dom.senderPronounInput?.value?.trim() || "";
      const receiverPronoun = app.dom.receiverPronounInput?.value?.trim() || "";
      const minInput = Number((document.getElementById("minLuck") || {}).value) || 1000;
      const maxInput = Number((document.getElementById("maxLuck") || {}).value) || 10000;
      const { safeMin, safeMax } = app.utils.normalizeMinMax(minInput, maxInput);
      app.state.currentMin = safeMin;
      app.state.currentMax = safeMax;

      try {
        const linkOutputEl = document.getElementById("linkOutput");
        const linkHintEl = document.getElementById("linkHint");

        const data = await app.api.requestJsonFromAnyApiBase("/api/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            title: (document.getElementById("cardTitleInput") || {}).value || "",
            wish: wishContent,
            audio: audioUrl,
            sender: senderPronoun,
            receiver: receiverPronoun,
            type: (document.getElementById("pageType") || {}).value || "basic",
            min: app.state.currentMin,
            max: app.state.currentMax,
          }),
        });

        const url = app.api.buildShareUrl(data.id);
        if (linkOutputEl) linkOutputEl.value = url;
        if (linkHintEl) linkHintEl.textContent = "Link có hiệu lực trong 20 phút.";
      } catch (error) {
        const linkHintEl = document.getElementById("linkHint");
        if (linkHintEl) linkHintEl.textContent = "Không tạo link được, thử lại nhé.";
      }
    });
  }

  parseLink();

  document.addEventListener("DOMContentLoaded", () => {
    app.views.loadComponent("link-box", "link-box-root");
  });
})();
