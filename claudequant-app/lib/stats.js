// ─── Statistics utility functions ────────────────────────────────────────────
export const mean = a => a.reduce((s, v) => s + v, 0) / a.length;

export const median = a => {
  const s = [...a].sort((x, y) => x - y), m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

export const std = a => {
  const m = mean(a);
  return Math.sqrt(a.reduce((s, v) => s + (v - m) ** 2, 0) / Math.max(1, a.length - 1));
};

export const corr = (x, y) => {
  const n = x.length, mx = mean(x), my = mean(y);
  let num = 0, dx2 = 0, dy2 = 0;
  for (let i = 0; i < n; i++) {
    const dx = x[i] - mx, dy = y[i] - my;
    num += dx * dy; dx2 += dx * dx; dy2 += dy * dy;
  }
  return dx2 && dy2 ? num / Math.sqrt(dx2 * dy2) : 0;
};

export const linReg = (x, y) => {
  const mx = mean(x), my = mean(y);
  let num = 0, den = 0;
  for (let i = 0; i < x.length; i++) {
    num += (x[i] - mx) * (y[i] - my);
    den += (x[i] - mx) ** 2;
  }
  const slope = den ? num / den : 0, intercept = my - slope * mx;
  return { slope, intercept, r2: corr(x, y) ** 2 };
};

export const getNumericCols = (data) =>
  data?.length ? Object.keys(data[0]).filter(k => typeof data[0][k] === "number") : [];

export const fmt = (v) =>
  typeof v === "number"
    ? (Math.abs(v) >= 1000 ? v.toLocaleString(undefined, { maximumFractionDigits: 2 }) : v.toFixed(Math.abs(v) < 1 ? 4 : 2))
    : v;
