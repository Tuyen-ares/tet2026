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

const builderSection = document.getElementById("builder");
const cardSection = document.getElementById("card");
const greeting = document.getElementById("greeting");
const subGreeting = document.getElementById("subGreeting");
const wishText = document.getElementById("wishText");
const expireNotice = document.getElementById("expireNotice");
const expiredBox = document.getElementById("expiredBox");
const linkForm = document.getElementById("linkForm");
const linkOutput = document.getElementById("linkOutput");
const copyBtn = document.getElementById("copyBtn");
const linkHint = document.getElementById("linkHint");
const spinBtn = document.getElementById("spinBtn");
const spinResult = document.getElementById("spinResult");
const canvas = document.getElementById("wheel");
const ctx = canvas.getContext("2d");
const effectsLayer = document.getElementById("effects");
const effectsBuilder = document.getElementById("effectsBuilder");
const loveAudio = document.getElementById("loveAudio");
const audioOverlay = document.getElementById("audioOverlay");

let currentAngle = 0;
let spinning = false;
let countdownTimer = null;
let currentMin = 1000;
let currentMax = 10000;
let lastActiveIndex = null;
let effectsTimer = null;

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

const baseUrl = () => {
  if (window.location.origin && window.location.origin !== "null") {
    return `${window.location.origin}`;
  }
  return window.location.href.split("?")[0].split("#")[0];
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
  builderSection.classList.remove("d-none");
  cardSection.classList.add("d-none");
  startContinuousEffects(effectsBuilder, "Yêu", Date.now());
};

const showCard = (name, createdAt, wish) => {
  builderSection.classList.add("d-none");
  cardSection.classList.remove("d-none");
  greeting.textContent = `Chúc mừng năm mới, ${name}!`;
  subGreeting.textContent = `Chúc ${name} một năm mới rực rỡ, bình an và luôn tràn ngập yêu thương.`;
  wishText.textContent = wish;
  startContinuousEffects(effectsLayer, name, createdAt);

  const updateCountdown = () => {
    const remaining = EXPIRY_MS - (Date.now() - createdAt);
    if (remaining <= 0) {
      expireNotice.textContent = "Link đã hết hạn.";
      expiredBox.classList.remove("d-none");
      spinBtn.disabled = true;
      stopContinuousEffects();
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
    const response = await fetch(`/api/card/${encodeURIComponent(cardId)}`);
    if (!response.ok) {
      showBuilder();
      return;
    }
    const data = await response.json();
    const wish =
      (data.wish ? data.wish : "").trim().replace(/{name}/gi, data.name) ||
      DEFAULT_WISH.replace(/{name}/g, data.name);

    currentMin = data.min || 1000;
    currentMax = data.max || 10000;
    setupAudio(data.audio);

    showCard(data.name, data.createdAt, wish);
    if (data.expired) {
      expiredBox.classList.remove("d-none");
      spinBtn.disabled = true;
    }
  } catch (error) {
    showBuilder();
  }
};

linkForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const name = document.getElementById("loverName").value.trim();
  if (!name) return;

  const wishContent = document.getElementById("wishContent").value.trim();
  const audioUrl = document.getElementById("audioUrl").value.trim();
  const minInput = Number(document.getElementById("minLuck").value) || 1000;
  const maxInput = Number(document.getElementById("maxLuck").value) || 10000;
  const { safeMin, safeMax } = normalizeMinMax(minInput, maxInput);
  currentMin = safeMin;
  currentMax = safeMax;

  try {
    const response = await fetch("/api/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        wish: wishContent,
        audio: audioUrl,
        min: currentMin,
        max: currentMax,
      }),
    });
    if (!response.ok) {
      linkHint.textContent = "Không tạo link được, thử lại nhé.";
      return;
    }
    const data = await response.json();
    const url = `${baseUrl()}/c/${data.id}`;
    linkOutput.value = url;
    linkHint.textContent = "Link có hiệu lực trong 20 phút.";
  } catch (error) {
    linkHint.textContent = "Không tạo link được, thử lại nhé.";
  }
});

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

spinBtn.addEventListener("click", spinWheel);

drawWheel(currentAngle);
parseLink();

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

const startContinuousEffects = (targetLayer, name, createdAt) => {
  stopContinuousEffects();
  const runCycle = () => {
    const remaining = EXPIRY_MS - (Date.now() - createdAt);
    if (remaining <= 0) {
      stopContinuousEffects();
      return;
    }
    triggerEffects(targetLayer);
    triggerNameFireworks(targetLayer, name);
    triggerNameFall(targetLayer, name);
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
