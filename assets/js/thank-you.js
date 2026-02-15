(() => {
  const params = new URLSearchParams(window.location.search);
  const rawName = (params.get("name") || "").trim();
  const safeName = rawName.replace(/[<>]/g, "");
  const receiverName = document.getElementById("receiverName");
  if (receiverName && safeName) {
    receiverName.textContent = safeName;
  }

  const effects = document.getElementById("thankYouEffects");
  if (!effects) return;

  const spawnLantern = () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const lantern = document.createElement("div");
    lantern.className = "lantern";
    lantern.style.left = `${Math.random() * width}px`;
    lantern.style.top = `${height + 30 + Math.random() * 80}px`;
    lantern.style.setProperty("--lantern-distance", `${-(height * (0.75 + Math.random() * 0.35))}px`);
    lantern.style.setProperty("--lantern-duration", `${7000 + Math.random() * 7000}ms`);
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
    effects.appendChild(lantern);

    setTimeout(() => {
      lantern.remove();
    }, 15000);
  };

  for (let i = 0; i < 8; i += 1) {
    setTimeout(spawnLantern, i * 280);
  }

  setInterval(spawnLantern, 950);
})();
