const EXPIRY_MS = 20 * 60 * 1000;
const baseSegments = ["1.000đ", "2.000đ", "3.000đ", "5.000đ", "8.000đ", "10.000đ"];
const segments = [...baseSegments];
const segmentColors = [
  "#d32f2f",
  "#f9a825",
  "#c62828",
  "#f57c00",
  "#b71c1c",
  "#ffb300",
];

// front-end can override `window.__API_BASE__` to point to a remote backend.
const API_BASE = (typeof window !== 'undefined' && window.__API_BASE__) || '';

const builderSection = document.getElementById("builder");
const linkForm = document.getElementById("linkForm");
const linkOutput = document.getElementById("linkOutput");
const copyBtn = document.getElementById("copyBtn");
const linkHint = document.getElementById("linkHint");
const effectsLayer = document.getElementById("effects");
const effectsBuilder = document.getElementById("effectsBuilder");
const audioOverlay = document.getElementById("audioOverlay");
const senderPronounInput = document.getElementById("senderPronoun");
const receiverPronounInput = document.getElementById("receiverPronoun");
const pageEyebrow = document.querySelector(".eyebrow");
const pageTitle = document.querySelector(".display-title");
const pageLead = document.querySelector(".lead");

const defaultHeader = {
  eyebrow: pageEyebrow ? pageEyebrow.textContent : "",
  title: pageTitle ? pageTitle.textContent : "",
  lead: pageLead ? pageLead.textContent : "",
};

// view-specific elements (populated after loading a view fragment)
let cardSection = null;
let greeting = null;
let cardTitle = null;
let subGreeting = null;
let wishText = null;
let expireNotice = null;
let expiredBox = null;
let spinBtn = null;
let spinResult = null;
let canvas = null;
let ctx = null;
let loveAudio = null;

let currentAngle = 0;
let spinning = false;
let countdownTimer = null;
let currentMin = 1000;
let currentMax = 10000;
let lastActiveIndex = null;
let effectsTimer = null;
let hasRedirectedToThankYou = false;

const DEFAULT_WISH =
  "Năm mới mở ra một hành trình mới, mong {name} luôn đủ mạnh mẽ để theo đuổi điều mình tin, đủ dịu dàng để giữ lại những điều đẹp nhất và đủ may mắn để hạnh phúc luôn ở cạnh.";

const formatVnd = (value) => `${value.toLocaleString("vi-VN")}đ`;

const normalizeMinMax = (min, max) => {
  const safeMin = Math.max(1000, Math.floor(min / 1000) * 1000);
  const safeMax = Math.max(safeMin, Math.floor(max / 1000) * 1000);
  return { safeMin, safeMax };
};

const randomVnd = (min, max) => {
  const { safeMin, safeMax } = normalizeMinMax(min, max);
  const steps = Math.floor((safeMax - safeMin) / 1000);
  const pick = safeMin + Math.floor(Math.random() * (steps + 1)) * 1000;
  return pick;
};

const truncateText = (text, limit = 180) => {
  const clean = String(text || "").trim().replace(/\s+/g, " ");
  if (clean.length <= limit) return clean;
  return `${clean.slice(0, limit).trim()}...`;
};

const formatTypeLabel = (type) => {
  if (type === "confess") return "Tỏ tình";
  if (type === "lucky") return "Lì xì";
  return "Chúc Tết";
};

const applyBuilderHeader = () => {
  document.body.classList.remove("receiver-mode");
  if (pageEyebrow) pageEyebrow.textContent = defaultHeader.eyebrow;
  if (pageTitle) pageTitle.textContent = defaultHeader.title;
  if (pageLead) pageLead.textContent = defaultHeader.lead;
};

const showInvalidLinkNotice = () => {
  if (!pageLead) return;
  pageLead.textContent = "Link không hợp lệ, đã hết hạn, hoặc backend chưa truy cập được. Hãy tạo link mới.";
};

const redirectToThankYou = (name) => {
  if (hasRedirectedToThankYou) return;
  hasRedirectedToThankYou = true;
  const url = new URL("thank-you.html", document.baseURI);
  url.searchParams.set("name", (name || "").trim());
  window.location.href = url.toString();
};

const applyReceiverHeader = ({ name, title, wish, type, sender, receiver }) => {
  document.body.classList.add("receiver-mode");
  if (pageEyebrow) {
    pageEyebrow.textContent = `${formatTypeLabel(type)} • Lời chúc dành cho ${name}`;
  }
  if (pageTitle) {
    pageTitle.textContent = title || `Chúc mừng năm mới, ${name}`;
  }
  if (pageLead) {
    const senderText = (sender || "Người gửi").trim();
    const receiverText = (receiver || "người nhận").trim();
    const wishPreview = truncateText(wish || "", 220);
    pageLead.innerHTML = "";

    const line = document.createElement("span");
    line.className = "heart-text";
    line.textContent = `${senderText} gửi ${receiverText} ${name} lời chúc đầu năm an lành và đầy yêu thương.`;

    const preview = document.createElement("span");
    preview.className = "wish-preview";
    preview.textContent = wishPreview ? `“${wishPreview}”` : "Chúc bạn một năm mới bình an, may mắn và hạnh phúc.";

    pageLead.appendChild(line);
    pageLead.appendChild(preview);
  }
};

const buildShareUrl = (id) => {
  const url = new URL(window.location.href);
  url.hash = "";
  url.search = "";
  url.searchParams.set("id", id);
  return url.toString();
};

const getApiBases = () => {
  const bases = [];
  if (API_BASE) bases.push(API_BASE.replace(/\/$/, ""));
  bases.push("");
  if (
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
  ) {
    bases.push("http://localhost:3000");
  }
  return [...new Set(bases)];
};

const requestJsonFromAnyApiBase = async (path, options = {}) => {
  const bases = getApiBases();
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
};

const drawWheel = (angle = 0) => {
  const size = canvas.width;
  const radius = size / 2;
  const arc = (2 * Math.PI) / segments.length;

  ctx.clearRect(0, 0, size, size);
  ctx.save();
  ctx.translate(radius, radius);
  ctx.rotate(angle);

  segments.forEach((label, index) => {
    const start = arc * index;
    const end = start + arc;

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, radius - 6, start, end);
    ctx.closePath();
    ctx.fillStyle = segmentColors[index % segmentColors.length];
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
};

const getSelectedIndex = (angle) => {
  const arc = (2 * Math.PI) / segments.length;
  const normalized =
    (2 * Math.PI -
      (angle % (2 * Math.PI)) +
      (3 * Math.PI) / 2 +
      arc / 2) %
    (2 * Math.PI);
  return Math.floor(normalized / arc);
};

const spinWheel = () => {
  if (spinning) return;
  spinning = true;
  spinBtn.disabled = true;
  spinResult.textContent = "Đang quay...";
  lastActiveIndex = null;
  baseSegments.forEach((label, index) => {
    segments[index] = label;
  });

  const start = performance.now();
  const duration = 3600;
  const spins = 4 + Math.random() * 2;
  const startAngle = currentAngle;
  const targetAngle = startAngle + spins * Math.PI * 2 + Math.random() * Math.PI;

  const animate = (time) => {
    const elapsed = time - start;
    const progress = Math.min(elapsed / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3);
    const angle = startAngle + (targetAngle - startAngle) * ease;
    currentAngle = angle;

    const activeIndex = getSelectedIndex(angle);
    if (lastActiveIndex !== null && lastActiveIndex !== activeIndex) {
      segments[lastActiveIndex] = baseSegments[lastActiveIndex];
    }
    segments[activeIndex] = formatVnd(randomVnd(currentMin, currentMax));
    lastActiveIndex = activeIndex;
    drawWheel(angle);

    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      finishSpin(angle);
    }
  };

  requestAnimationFrame(animate);
};

const finishSpin = (angle) => {
  const index = getSelectedIndex(angle);
  baseSegments.forEach((label, idx) => {
    segments[idx] = label;
  });
  const jumpDuration = 600;
  const jumpInterval = 60;
  const jumpStart = Date.now();
  const jumpTimer = setInterval(() => {
    const randomValue = randomVnd(currentMin, currentMax);
    segments[index] = formatVnd(randomValue);
    drawWheel(currentAngle);
    spinResult.textContent = `Lì xì thực nhận: ${formatVnd(
      randomValue
    )}`;
    if (Date.now() - jumpStart > jumpDuration) {
      clearInterval(jumpTimer);
      const finalValue = randomVnd(currentMin, currentMax);
      const finalLabel = formatVnd(finalValue);
      segments[index] = finalLabel;
      drawWheel(currentAngle);
      spinResult.textContent = `Lì xì thực nhận: ${formatVnd(
        finalValue
      )}`;
      spinning = false;
      spinBtn.disabled = false;
    }
  }, jumpInterval);
};

const showBuilder = () => {
  applyBuilderHeader();
  builderSection.classList.remove("d-none");
  if (cardSection) cardSection.classList.add("d-none");
  startContinuousEffects(effectsBuilder, "Yêu", Date.now());
};

const showCard = (name, createdAt, wish, title, viewType = 'basic') => {
  builderSection.classList.add("d-none");
  if (cardSection) cardSection.classList.remove("d-none");
  if (greeting) greeting.textContent = `Chúc mừng năm mới, ${name}!`;
  if (cardTitle) cardTitle.textContent = title || "";
  // subGreeting will be set in updateHeaderLine for personalization
  if (wishText) wishText.textContent = wish;
  startContinuousEffects(effectsLayer, name, createdAt, viewType);

  const updateCountdown = () => {
    if (!expireNotice) return;
    const remaining = EXPIRY_MS - (Date.now() - createdAt);
    if (remaining <= 0) {
      expireNotice.textContent = "Link đã hết hạn. Đang chuyển trang...";
      stopContinuousEffects();
      if (countdownTimer) {
        clearInterval(countdownTimer);
        countdownTimer = null;
      }
      redirectToThankYou(name);
      return;
    }
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    expireNotice.textContent = `Link còn hiệu lực: ${minutes
      .toString()
      .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  updateCountdown();
  countdownTimer = setInterval(updateCountdown, 1000);
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
    const data = await requestJsonFromAnyApiBase(`/api/card/${encodeURIComponent(cardId)}`);
    if (data.expired) {
      redirectToThankYou(data.name);
      return;
    }
    const wish =
      (data.wish ? data.wish : "").trim().replace(/{name}/gi, data.name) ||
      DEFAULT_WISH.replace(/{name}/g, data.name);

    currentMin = data.min || 1000;
    currentMax = data.max || 10000;
    // load view fragment based on type, then initialize view elements
    const viewType = data.type || 'basic';
    await loadViewFragment(viewType);
    applyReceiverHeader({
      name: data.name,
      title: data.title,
      wish,
      type: viewType,
      sender: data.sender,
      receiver: data.receiver,
    });
    updateHeaderLine(data.name, data.sender, data.receiver);
    setupAudio(data.audio);

    showCard(data.name, data.createdAt, wish, data.title, viewType);
  } catch (error) {
    showBuilder();
    showInvalidLinkNotice();
  }
};

linkForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const name = document.getElementById("loverName").value.trim();
  if (!name) return;

  const wishContent = document.getElementById("wishContent").value.trim();
  const audioUrl = document.getElementById("audioUrl").value.trim();
  const senderPronoun = senderPronounInput?.value?.trim() || "";
  const receiverPronoun = receiverPronounInput?.value?.trim() || "";
  const minInput = Number(document.getElementById("minLuck").value) || 1000;
  const maxInput = Number(document.getElementById("maxLuck").value) || 10000;
  const { safeMin, safeMax } = normalizeMinMax(minInput, maxInput);
  currentMin = safeMin;
  currentMax = safeMax;

  try {
    // Query these at submit time because the link-box component is loaded
    // asynchronously and `linkOutput` / `linkHint` may be null earlier.
    const linkOutputEl = document.getElementById('linkOutput');
    const linkHintEl = document.getElementById('linkHint');

    const data = await requestJsonFromAnyApiBase(`/api/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        title: (document.getElementById('cardTitleInput') || {}).value || '',
        wish: wishContent,
        audio: audioUrl,
        sender: senderPronoun,
        receiver: receiverPronoun,
        type: (document.getElementById('pageType') || {}).value || 'basic',
        min: currentMin,
        max: currentMax,
      }),
    });
    // Use query param for compatibility with static servers that don't
    // rewrite SPA routes (ensures index.html is served and the client
    // can read ?id=... and show the card view).
    const url = buildShareUrl(data.id);
    if (linkOutputEl) linkOutputEl.value = url;
    if (linkHintEl) linkHintEl.textContent = "Link có hiệu lực trong 20 phút.";
  } catch (error) {
    const linkHintEl = document.getElementById('linkHint');
    if (linkHintEl) linkHintEl.textContent = "Không tạo link được, thử lại nhé.";
  }
});

if (copyBtn) {
  copyBtn.addEventListener("click", async () => {
    if (!linkOutput.value) return;
    try {
      await navigator.clipboard.writeText(linkOutput.value);
      copyBtn.textContent = "Đã sao chép";
      setTimeout(() => {
        copyBtn.textContent = "Sao chép";
      }, 1500);
    } catch (error) {
      copyBtn.textContent = "Không sao chép được";
    }
  });
}

// helper: load a view fragment into #view-root and init view elements
async function loadViewFragment(type) {
  const root = document.getElementById('view-root');
  if (!root) return;
  try {
    let res = await fetch(`views/${type}.html`);
    if (!res.ok) {
      // fallback to basic view to avoid leaving the builder visible but
      // without a proper recipient card. This makes the experience more
      // robust on static servers where specific fragments may be missing.
      res = await fetch(`views/basic.html`);
      if (!res.ok) {
        root.innerHTML = '<div class="text-center p-4">Không tìm thấy view.</div>';
        return;
      }
    }
    const html = await res.text();
    root.innerHTML = html;
    initViewElements();
  } catch (err) {
    root.innerHTML = '<div class="text-center p-4">Lỗi khi tải view.</div>';
  }
}

function initViewElements() {
  cardSection = document.getElementById('card');
  greeting = document.getElementById('greeting');
  cardTitle = document.getElementById('cardTitle');
  subGreeting = document.getElementById('subGreeting');
  wishText = document.getElementById('wishText');
  expireNotice = document.getElementById('expireNotice');
  expiredBox = document.getElementById('expiredBox');
  spinBtn = document.getElementById('spinBtn');
  spinResult = document.getElementById('spinResult');
  canvas = document.getElementById('wheel');
  loveAudio = document.getElementById('loveAudio');
  if (canvas) {
    try {
      ctx = canvas.getContext('2d');
    } catch (e) {
      ctx = null;
    }
  }
  if (spinBtn) {
    spinBtn.removeEventListener('click', spinWheel);
    spinBtn.addEventListener('click', spinWheel);
  }
  if (canvas && ctx) drawWheel(currentAngle);
}

// init: draw static wheel on page load if no card id
parseLink();

// load shared components (link-box)
async function loadComponent(name, targetId) {
  const root = document.getElementById(targetId);
  if (!root) return;
  try {
    const res = await fetch(`components/${name}.html`);
    if (!res.ok) return;
    root.innerHTML = await res.text();
    // re-wire copy button and linkOutput if component provides them
    const copy = document.getElementById('copyBtn');
    if (copy) {
      copy.removeEventListener('click', () => { });
      copy.addEventListener('click', async () => {
        const linkOutputEl = document.getElementById('linkOutput');
        if (!linkOutputEl || !linkOutputEl.value) return;
        try {
          await navigator.clipboard.writeText(linkOutputEl.value);
          copy.textContent = 'Đã sao chép';
          setTimeout(() => (copy.textContent = 'Sao chép'), 1500);
        } catch (e) {
          copy.textContent = 'Không sao chép được';
        }
      });
    }
  } catch (err) {
    // ignore
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadComponent('link-box', 'link-box-root');
});

const setupAudio = (audioUrl) => {
  if (!loveAudio) return;
  if (!audioUrl) {
    loveAudio.src = "";
    if (audioOverlay) {
      audioOverlay.classList.add("d-none");
    }
    return;
  }
  loveAudio.controls = false;
  loveAudio.preload = "auto";
  loveAudio.src = audioUrl;
  loveAudio.load();
  loveAudio.volume = 0.7;
  loveAudio.loop = true;
  loveAudio.autoplay = true;
  if (audioOverlay) {
    audioOverlay.classList.remove("d-none");
  }
  const tryPlay = () => {
    loveAudio.play().catch(() => {
      if (audioOverlay) {
        audioOverlay.classList.remove("d-none");
      }
    });
  };
  loveAudio.addEventListener("canplay", tryPlay, { once: true });
  setTimeout(tryPlay, 150);
  const handleUserInteract = () => {
    loveAudio.play().finally(() => {
      if (audioOverlay) {
        audioOverlay.classList.add("d-none");
      }
    });
  };
  document.addEventListener("click", handleUserInteract, { once: true });
  document.addEventListener("touchstart", handleUserInteract, { once: true });
  loveAudio.addEventListener("play", () => {
    if (audioOverlay) {
      audioOverlay.classList.add("d-none");
    }
  });
};

const triggerEffects = (targetLayer) => {
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
        setTimeout(() => {
          spark.remove();
        }, 1500);
      }
    }, baseDelay);
  }

  setTimeout(() => {
    targetLayer.innerHTML = "";
  }, 4200);
};

const triggerLanterns = (targetLayer, count = 6) => {
  if (!targetLayer) return;
  const width = window.innerWidth;
  const height = window.innerHeight;

  for (let i = 0; i < count; i += 1) {
    const lantern = document.createElement('div');
    lantern.className = 'lantern';
    const left = Math.random() * width;
    lantern.style.left = `${left}px`;
    lantern.style.top = `${height + 20 + Math.random() * 40}px`;
    const distance = -(height * (0.6 + Math.random() * 0.4));
    lantern.style.setProperty('--lantern-distance', `${distance}px`);
    const dur = 6000 + Math.random() * 6000;
    lantern.style.setProperty('--lantern-duration', `${dur}ms`);
    lantern.style.setProperty('--lantern-sway', `${2 + Math.random() * 2}s`);

    const body = document.createElement('div');
    body.className = 'lantern-body';
    const frame = document.createElement('div');
    frame.className = 'lantern-frame';
    const flame = document.createElement('div');
    flame.className = 'lantern-flame';

    lantern.appendChild(frame);
    lantern.appendChild(body);
    lantern.appendChild(flame);

    targetLayer.appendChild(lantern);

    // remove after animation ends
    setTimeout(() => {
      lantern.remove();
    }, dur + 200);
  }
};

const updateHeaderLine = (name, sender, receiver) => {
  const cleanSender = (sender || "Người gửi").toLowerCase();
  const cleanReceiver = (receiver || "người nhận").toLowerCase();
  if (subGreeting) {
    subGreeting.textContent = `${cleanSender} mong ${cleanReceiver} ${name || ""} luôn rực rỡ, bình an và tràn ngập yêu thương.`;
  }
};

const triggerNameFireworks = (targetLayer, name) => {
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
        particle.style.setProperty(
          "--spark-x",
          `${Math.cos(angle) * distance}px`
        );
        particle.style.setProperty(
          "--spark-y",
          `${Math.sin(angle) * distance}px`
        );
        targetLayer.appendChild(particle);
        setTimeout(() => {
          particle.remove();
        }, 1700);
      }
    }, baseDelay);
  }
};

const triggerNameFall = (targetLayer, name) => {
  if (!targetLayer) return;
  const width = window.innerWidth;
  const height = window.innerHeight;
  const safeName = (name || "").trim() || "Yêu";
  const headerY = height * 0.15 + 40;

  for (let i = 0; i < 12; i += 1) {
    const fall = document.createElement("div");
    fall.className = "name-fall";
    fall.textContent = safeName;
    const startX = Math.random() * width;
    const drift = (Math.random() - 0.5) * 140;
    fall.style.left = `${startX}px`;
    fall.style.top = `${headerY}px`;
    fall.style.setProperty("--fall-x", `${drift}px`);
    fall.style.setProperty("--fall-y", `${height * 0.6 + Math.random() * 140}px`);
    fall.style.animationDelay = `${Math.random() * 0.4}s`;
    targetLayer.appendChild(fall);
    setTimeout(() => {
      fall.remove();
    }, 3600);
  }
};

const startContinuousEffects = (targetLayer, name, createdAt, viewType = 'basic') => {
  stopContinuousEffects();
  const runCycle = () => {
    const remaining = EXPIRY_MS - (Date.now() - createdAt);
    if (remaining <= 0) {
      stopContinuousEffects();
      return;
    }
    if (viewType === 'basic') {
      triggerLanterns(targetLayer, 6);
    } else {
      triggerEffects(targetLayer);
      triggerNameFireworks(targetLayer, name);
      triggerNameFall(targetLayer, name);
    }
  };
  runCycle();
  effectsTimer = setInterval(runCycle, 4500);
};

const stopContinuousEffects = () => {
  if (effectsTimer) {
    clearInterval(effectsTimer);
    effectsTimer = null;
  }
};
