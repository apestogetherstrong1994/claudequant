// ─── Seeded PRNG + sample dataset generators ───────────────────────────────
const prng = (s) => {
  let seed = s;
  return () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
};

export const genStocks = () => {
  const r = prng(42), d = [];
  let a = 243, g = 196, m = 428, s = 596;
  for (let i = 0; i < 50; i++) {
    const mkt = (r() - 0.47) * 4;
    a += mkt * 1.3 + (r() - 0.5) * 3;
    g += mkt * 0.9 + (r() - 0.5) * 2;
    m += mkt * 1.1 + (r() - 0.5) * 3;
    s += mkt * 0.6 + (r() - 0.5) * 1.5;
    const dt = new Date(2025, 0, 2 + i);
    d.push({
      Date: `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`,
      AAPL: +a.toFixed(2), GOOGL: +g.toFixed(2), MSFT: +m.toFixed(2), SPY: +s.toFixed(2),
      Volume: Math.round(45e6 + r() * 35e6),
    });
  }
  return d;
};

export const genResearch = () => {
  const r = prng(17), d = [];
  for (let i = 0; i < 40; i++) {
    const study = 1 + r() * 9, sleep = 4 + r() * 5, ex = r() * 6;
    const stress = Math.max(1, Math.min(10, 7.5 - study * 0.2 - sleep * 0.15 - ex * 0.3 + r() * 3.5));
    const gpa = Math.max(2.0, Math.min(4.0, 1.7 + study * 0.16 + sleep * 0.07 - stress * 0.05 + r() * 0.35));
    d.push({
      Student_ID: `S${String(i + 1).padStart(3, "0")}`,
      Study_Hours: +study.toFixed(1), Sleep_Hours: +sleep.toFixed(1),
      Exercise_Hours: +ex.toFixed(1), Stress_Level: +stress.toFixed(1), GPA: +gpa.toFixed(2),
    });
  }
  return d;
};
