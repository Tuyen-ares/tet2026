export const safeInt = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.floor(parsed) : fallback;
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
