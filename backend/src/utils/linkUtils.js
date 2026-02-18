export const safeInt = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.floor(parsed) : fallback;
};

export const DEFAULT_THEME = Object.freeze({
  pageBg: "#7f161a",
  textColor: "#fff7ea",
  buttonBg: "#f3bb63",
  buttonText: "#5b1a0f",
  cardBg: "#7a1217",
});

const HEX_COLOR_RE = /^#(?:[0-9a-fA-F]{6})$/;

const normalizeHexColor = (value) => {
  const text = String(value || "").trim();
  if (!text) return null;
  if (HEX_COLOR_RE.test(text)) return text.toLowerCase();
  return null;
};

export const sanitizeThemeInput = (themeInput) => {
  const source = typeof themeInput === "object" && themeInput ? themeInput : {};
  return {
    pageBg: normalizeHexColor(source.pageBg) || DEFAULT_THEME.pageBg,
    textColor: normalizeHexColor(source.textColor) || DEFAULT_THEME.textColor,
    buttonBg: normalizeHexColor(source.buttonBg) || DEFAULT_THEME.buttonBg,
    buttonText: normalizeHexColor(source.buttonText) || DEFAULT_THEME.buttonText,
    cardBg: normalizeHexColor(source.cardBg) || DEFAULT_THEME.cardBg,
  };
};

export const parseStoredTheme = (raw) => {
  if (!raw) return { ...DEFAULT_THEME };
  if (typeof raw === "object") return sanitizeThemeInput(raw);
  try {
    return sanitizeThemeInput(JSON.parse(raw));
  } catch (error) {
    return { ...DEFAULT_THEME };
  }
};

export const normalizeMinMax = (min, max) => {
  const safeMin = Math.max(1000, Math.floor(min / 1000) * 1000);
  const safeMax = Math.max(safeMin, Math.floor(max / 1000) * 1000);
  return { safeMin, safeMax };
};

export const generateId = () => {
  const seed = Math.random().toString(36).slice(2);
  const time = Date.now().toString(36);
  return `${time}${seed}`.slice(0, 10);
};
