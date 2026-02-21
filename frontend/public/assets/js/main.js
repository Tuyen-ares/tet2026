(() => {
  const app = window.TetApp;
  let themeBuilderWired = false;
  let previewFrameLoaded = false;
  let previewPostTimer = null;
  const searchParams = new URLSearchParams(window.location.search);
  const isPreviewMode = searchParams.get("preview") === "1";

  const buildPreviewPayload = () => {
    const name = (document.getElementById("loverName") || {}).value?.trim() || "Người thương";
    const title = (document.getElementById("cardTitleInput") || {}).value?.trim() || "";
    const wish = (document.getElementById("wishContent") || {}).value?.trim() || "";
    const type = (document.getElementById("pageType") || {}).value || "basic";
    const sender = app.dom.senderPronounInput?.value?.trim() || "Người gửi";
    const receiver = app.dom.receiverPronounInput?.value?.trim() || "người nhận";
    const min = Number((document.getElementById("minLuck") || {}).value) || 1000;
    const max = Number((document.getElementById("maxLuck") || {}).value) || 10000;
    const theme = app.utils.readThemeInputs();
    return { name, title, wish, type, sender, receiver, min, max, theme };
  };

  const postPreviewPayload = () => {
    const frame = app.dom.fullPagePreviewFrame;
    if (!frame?.contentWindow) return;
    frame.contentWindow.postMessage(
      {
        source: "theme-preview",
        payload: buildPreviewPayload(),
      },
      window.location.origin
    );
  };

  const requestPreviewPost = () => {
    if (previewPostTimer) clearTimeout(previewPostTimer);
    previewPostTimer = setTimeout(postPreviewPayload, 90);
  };

  const ensurePreviewFrame = () => {
    const frame = app.dom.fullPagePreviewFrame;
    if (!frame || frame.src) return;
    const url = new URL(window.location.href);
    url.search = "";
    url.hash = "";
    url.searchParams.set("preview", "1");
    frame.src = url.toString();
    frame.addEventListener("load", () => {
      previewFrameLoaded = true;
      requestPreviewPost();
    });
  };

  const wireThemeBuilder = () => {
    if (themeBuilderWired) return;
    themeBuilderWired = true;

    const themeInputs = [
      app.dom.themePageBgInput,
      app.dom.themeCardBgInput,
      app.dom.themeTextColorInput,
      app.dom.themeButtonBgInput,
      app.dom.themeButtonTextInput,
    ].filter(Boolean);

    const refreshPreview = () => {
      app.utils.applyThemeToPreview(app.utils.readThemeInputs());
      if (previewFrameLoaded) requestPreviewPost();
    };

    themeInputs.forEach((input) => {
      input.addEventListener("input", refreshPreview);
      input.addEventListener("change", refreshPreview);
    });

    const contentInputs = [
      document.getElementById("loverName"),
      document.getElementById("cardTitleInput"),
      document.getElementById("pageType"),
      document.getElementById("wishContent"),
      app.dom.senderPronounInput,
      app.dom.receiverPronounInput,
      document.getElementById("minLuck"),
      document.getElementById("maxLuck"),
    ].filter(Boolean);

    contentInputs.forEach((input) => {
      input.addEventListener("input", () => previewFrameLoaded && requestPreviewPost());
      input.addEventListener("change", () => previewFrameLoaded && requestPreviewPost());
    });

    app.dom.advancedCustomizeBtn?.addEventListener("click", () => {
      const panel = app.dom.advancedCustomizer;
      if (!panel) return;
      panel.classList.toggle("d-none");
      const isOpen = !panel.classList.contains("d-none");
      if (app.dom.advancedCustomizeBtn) {
        app.dom.advancedCustomizeBtn.textContent = isOpen ? "Ẩn tùy chỉnh nâng cao" : "Tùy chỉnh nâng cao";
      }
      if (isOpen) {
        ensurePreviewFrame();
        setTimeout(requestPreviewPost, 40);
      }
    });

    app.dom.themeResetBtn?.addEventListener("click", () => {
      app.utils.resetThemeInputs();
      if (previewFrameLoaded) requestPreviewPost();
    });

    app.utils.resetThemeInputs();
    ensurePreviewFrame();
  };

  const showBuilder = () => {
    app.utils.applyBuilderHeader();
    wireThemeBuilder();
    if (app.dom.builderSection) app.dom.builderSection.classList.remove("d-none");
    if (app.state.view.cardSection) app.state.view.cardSection.classList.add("d-none");
    app.effects.startContinuousEffects(app.dom.effectsBuilder, "Yêu", Date.now(), "builder");
  };

  const showCard = (name, createdAt, wish, title, viewType = "basic", options = {}) => {
    const { showCountdown = true, expiresAt = null } = options;
    if (app.dom.builderSection) app.dom.builderSection.classList.add("d-none");
    if (app.state.view.cardSection) app.state.view.cardSection.classList.remove("d-none");
    if (app.state.view.greeting) app.state.view.greeting.textContent = `Chúc mừng năm mới, ${name}!`;
    if (app.state.view.cardTitle) app.state.view.cardTitle.textContent = title || "";
    if (app.state.view.wishText) app.state.view.wishText.textContent = wish;

    if (showCountdown) {
      app.effects.startContinuousEffects(app.dom.effectsLayer, name, createdAt, viewType);
    } else {
      app.effects.stopContinuousEffects();
    }
    if (app.wheel && typeof app.wheel.syncFromState === "function") {
      app.wheel.syncFromState();
    }

    const updateCountdown = () => {
      if (!app.state.view.expireNotice) return;
      if (expiresAt == null) {
        app.state.view.expireNotice.textContent = "Link vô thời hạn";
        return;
      }

      const remaining = expiresAt - Date.now();

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

    if (!showCountdown) {
      if (app.state.countdownTimer) {
        clearInterval(app.state.countdownTimer);
        app.state.countdownTimer = null;
      }
      if (app.state.view.expireNotice) app.state.view.expireNotice.textContent = "Chế độ xem trước";
      return;
    }

    updateCountdown();
    if (expiresAt != null) {
      app.state.countdownTimer = setInterval(updateCountdown, 1000);
    }
  };

  const getCardId = () => {
    const params = new URLSearchParams(window.location.search);
    const queryId = params.get("id");
    if (queryId) return queryId;

    const match = window.location.pathname.match(/\/c\/([^/]+)/);
    return match ? match[1] : null;
  };

  const renderPreviewMode = async (payload = {}) => {
    const merged = {
      name: "Người thương",
      title: "",
      wish: "",
      type: "basic",
      sender: "Người gửi",
      receiver: "người nhận",
      theme: app.constants.DEFAULT_THEME,
      ...payload,
    };

    const viewType = merged.type || "basic";
    if (!app.state.view.cardSection || app.state.currentViewType !== viewType) {
      await app.views.loadViewFragment(viewType);
    }

    app.state.currentViewType = viewType;
    app.state.currentCardId = null;
    app.state.currentReceiverName = merged.name;
    app.state.hasSpun = false;
    app.state.prizeAmount = null;

    const wish =
      (merged.wish ? merged.wish : "").trim().replace(/{name}/gi, merged.name) ||
      app.constants.DEFAULT_WISH.replace(/{name}/g, merged.name);

    app.utils.applyTheme(merged.theme);
    app.utils.applyReceiverHeader({
      name: merged.name,
      title: merged.title,
      wish,
      type: viewType,
      sender: merged.sender,
      receiver: merged.receiver,
    });
    app.utils.updateHeaderLine(merged.name, merged.sender, merged.receiver);
    app.audio.setupAudio("");
    showCard(merged.name, Date.now(), wish, merged.title, viewType, { showCountdown: false });
  };

  const parseLink = async () => {
    if (isPreviewMode) {
      await renderPreviewMode({
        type: searchParams.get("type") || "basic",
        name: searchParams.get("name") || "Người thương",
      });
      window.addEventListener("message", (event) => {
        if (event.origin !== window.location.origin) return;
        if (event.data?.source !== "theme-preview") return;
        renderPreviewMode(event.data.payload || {});
      });
      return;
    }

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
      app.state.currentTheme = app.utils.normalizeTheme(data.theme);

      await app.views.loadViewFragment(viewType);
      app.utils.applyTheme(app.state.currentTheme);
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

      showCard(data.name, data.createdAt, wish, data.title, viewType, { expiresAt: data.expiresAt });
    } catch (error) {
      showBuilder();
      app.utils.showInvalidLinkNotice();
    }
  };

  if (app.dom.linkForm && !isPreviewMode) {
    app.dom.linkForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      const name = (document.getElementById("loverName") || {}).value?.trim();
      if (!name) return;

      const wishContent = (document.getElementById("wishContent") || {}).value?.trim() || "";
      const audioUrl = (document.getElementById("audioUrl") || {}).value?.trim() || "";
      const senderPronoun = app.dom.senderPronounInput?.value?.trim() || "";
      const receiverPronoun = app.dom.receiverPronounInput?.value?.trim() || "";
      const accessCode = (document.getElementById("accessCode") || {}).value?.trim() || "";
      const minInput = Number((document.getElementById("minLuck") || {}).value) || 1000;
      const maxInput = Number((document.getElementById("maxLuck") || {}).value) || 10000;
      const { safeMin, safeMax } = app.utils.normalizeMinMax(minInput, maxInput);
      const theme = app.utils.readThemeInputs();
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
            theme,
            accessCode,
          }),
        });

        const url = app.api.buildShareUrl(data.id);
        if (linkOutputEl) linkOutputEl.value = url;
        if (linkHintEl) {
          linkHintEl.textContent = data.unlimited ? "Link vô thời hạn đã được bật." : "Link có hiệu lực trong 20 phút.";
        }
      } catch (error) {
        const linkHintEl = document.getElementById("linkHint");
        if (linkHintEl) linkHintEl.textContent = "Không tạo link được, thử lại nhé.";
      }
    });
  }

  parseLink();

  document.addEventListener("DOMContentLoaded", () => {
    if (!isPreviewMode) app.views.loadComponent("link-box", "link-box-root");
  });
})();
