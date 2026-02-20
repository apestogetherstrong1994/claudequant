"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import {
  LineChart, Line, BarChart, Bar, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area
} from "recharts";
import { Upload, ChevronDown, ChevronRight, X, ArrowRight, ArrowUp, Database, BarChart2, TrendingUp, Activity, Search, FileText, Zap, PanelLeft, Plus, MoreHorizontal, Square, MessageSquare } from "lucide-react";
import * as Papa from "papaparse";

// ─── Design System (extracted from Claude/Cowork) ───────────────────────────
const C = {
  bg: "#262624",
  bgComposer: "#30302E",
  bgDeep: "#141413",
  bgHover: "#3a3a38",
  text: "#FAF9F5",
  textSec: "#C2C0B6",
  textMuted: "#9C9A92",
  accent: "#D97757",
  accentHover: "#e08565",
  border: "rgba(222,220,209,0.15)",
  green: "#7dba6d", red: "#cf6b63", blue: "#6ba8cf", purple: "#9b7ed4",
  chart: ["#D97757", "#6ba8cf", "#9b7ed4", "#7dba6d", "#cf6b63", "#cfb86b"],
  sans: 'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  serif: 'Georgia, "Times New Roman", Times, serif',
  mono: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace',
  shadow: "rgba(0,0,0,0.075) 0px 4px 20px 0px, rgba(222,220,209,0.3) 0px 0px 0px 0.5px",
  shadowSoft: "rgba(0,0,0,0.06) 0px 2px 12px 0px, rgba(222,220,209,0.12) 0px 0px 0px 0.5px",
  grid: "linear-gradient(to right, #1F1E1D 1px, transparent 1px), linear-gradient(#1F1E1D 1px, transparent 1px)",
};

// ─── Real Claude Logo SVG ───────────────────────────────────────────────────
const ClaudeLogo = ({ size = 40, color = C.accent }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill={color}>
    <path d="m3.127 10.604 3.135-1.76.053-.153-.053-.085H6.11l-.525-.032-1.791-.048-1.554-.065-1.505-.08-.38-.081L0 7.832l.036-.234.32-.214.455.04 1.009.069 1.513.105 1.097.064 1.626.17h.259l.036-.105-.089-.065-.068-.064-1.566-1.062-1.695-1.121-.887-.646-.48-.327-.243-.306-.104-.67.435-.48.585.04.15.04.593.456 1.267.981 1.654 1.218.242.202.097-.068.012-.049-.109-.181-.9-1.626-.96-1.655-.428-.686-.113-.411a2 2 0 0 1-.068-.484l.496-.674L4.446 0l.662.089.279.242.411.94.666 1.48 1.033 2.014.302.597.162.553.06.17h.105v-.097l.085-1.134.157-1.392.154-1.792.052-.504.25-.605.497-.327.387.186.319.456-.045.294-.19 1.23-.37 1.93-.243 1.29h.142l.161-.16.654-.868 1.097-1.372.484-.545.565-.601.363-.287h.686l.505.751-.226.775-.707.895-.585.759-.839 1.13-.524.904.048.072.125-.012 1.897-.403 1.024-.186 1.223-.21.553.258.06.263-.218.536-1.307.323-1.533.307-2.284.54-.028.02.032.04 1.029.098.44.024h1.077l2.005.15.525.346.315.424-.053.323-.807.411-3.631-.863-.872-.218h-.12v.073l.726.71 1.331 1.202 1.667 1.55.084.383-.214.302-.226-.032-1.464-1.101-.565-.497-1.28-1.077h-.084v.113l.295.432 1.557 2.34.08.718-.112.234-.404.141-.444-.08-.911-1.28-.94-1.44-.759-1.291-.093.053-.448 4.821-.21.246-.484.186-.403-.307-.214-.496.214-.98.258-1.28.21-1.016.19-1.263.112-.42-.008-.028-.092.012-.953 1.307-1.448 1.957-1.146 1.227-.274.109-.477-.247.045-.44.266-.39 1.586-2.018.956-1.25.617-.723-.004-.105h-.036l-4.212 2.736-.75.096-.324-.302.04-.496.154-.162 1.267-.871z" />
  </svg>
);

// ─── Streaming dots animation ────────────────────────────────────────────────
const StreamingDots = () => (
  <span style={{ display: "inline-flex", gap: 3, marginLeft: 4 }}>
    {[0, 1, 2].map(i => (
      <span key={i} style={{
        width: 4, height: 4, borderRadius: "50%", background: C.accent,
        animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
      }} />
    ))}
    <style>{`@keyframes pulse { 0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); } 40% { opacity: 1; transform: scale(1); } }`}</style>
  </span>
);

// ─── Pre-clean: strip code fences that wrap [QUESTION] blocks ────────────────
function preCleanQuestionText(text) {
  if (!text) return text;
  // Remove code fences (```) that appear right before [QUESTION] or right after [/QUESTION]
  let clean = text.replace(/```\s*\n?\s*\[QUESTION\]/g, '[QUESTION]');
  clean = clean.replace(/\[\/QUESTION\]\s*\n?\s*```/g, '[/QUESTION]');
  // Also handle case where entire block is inside a code fence
  clean = clean.replace(/```[\s\S]*?\[QUESTION\]/g, '[QUESTION]');
  return clean;
}

// ─── Question parser: extracts [QUESTION] blocks from Claude's response ─────
function parseMessageContent(text) {
  if (!text) return { segments: [], hasQuestions: false };
  // Pre-clean code fences that wrap question blocks
  const cleaned = preCleanQuestionText(text);
  const segments = [];
  const regex = /\[QUESTION\]\s*([\s\S]*?)\s*\[\/QUESTION\]/g;
  let lastIndex = 0;
  let match;
  let hasQuestions = false;

  while ((match = regex.exec(cleaned)) !== null) {
    hasQuestions = true;
    // Text before the question block
    if (match.index > lastIndex) {
      const before = cleaned.slice(lastIndex, match.index).trim();
      if (before) segments.push({ type: "text", content: before });
    }
    // Parse the question block
    const block = match[1];
    const titleMatch = block.match(/title:\s*(.+)/);
    const descMatch = block.match(/description:\s*(.+)/);
    const optionsRaw = block.match(/options:\s*([\s\S]*)/);
    const options = [];
    if (optionsRaw) {
      const lines = optionsRaw[1].split("\n").map(l => l.trim()).filter(l => l.startsWith("- "));
      for (const line of lines) {
        const parts = line.slice(2).split("|").map(s => s.trim());
        options.push({ label: parts[0], description: parts[1] || "" });
      }
    }
    segments.push({
      type: "question",
      title: titleMatch ? titleMatch[1].trim() : "Question",
      description: descMatch ? descMatch[1].trim() : "",
      options,
    });
    lastIndex = regex.lastIndex;
  }

  // Remaining text after last question
  if (lastIndex < cleaned.length) {
    const remaining = cleaned.slice(lastIndex).trim();
    if (remaining) segments.push({ type: "text", content: remaining });
  }

  // If no questions found, return the whole text as a single segment
  if (!hasQuestions) {
    segments.push({ type: "text", content: text });
  }

  return { segments, hasQuestions };
}

// ─── Strip [QUESTION] blocks for clean display during streaming ─────────────
// Simple approach: just show text BEFORE the first [QUESTION tag appears
function getDisplayText(text) {
  if (!text) return '';
  // Pre-clean code fences around question blocks
  const cleaned = preCleanQuestionText(text);
  // Find the first [QUESTION] tag and only show text before it
  const idx = cleaned.search(/\[QUESTION\]/);
  if (idx !== -1) {
    return cleaned.slice(0, idx).replace(/\s*[-]{3,}\s*$/, '').trim();
  }
  // Check for partial [QUESTION tag still being streamed (e.g. "[QUEST")
  const partialIdx = cleaned.search(/\[Q(?:U(?:E(?:S(?:T(?:I(?:O(?:N)?)?)?)?)?)?)?$/);
  if (partialIdx !== -1) {
    return cleaned.slice(0, partialIdx).trim();
  }
  // Also check for code fence that might precede a [QUESTION] being streamed
  const fenceIdx = cleaned.search(/```\s*$/);
  if (fenceIdx !== -1 && cleaned.length - fenceIdx < 10) {
    // A trailing code fence might be about to wrap a [QUESTION] — strip it
    return cleaned.slice(0, fenceIdx).trim();
  }
  return cleaned;
}

// ─── QuestionOverlay: replaces the composer, one question at a time ──────────
const QuestionOverlay = ({ question, questionIndex, totalQuestions, onSelect, onSkip }) => {
  const [showFreeText, setShowFreeText] = useState(false);
  const [freeText, setFreeText] = useState("");

  // Reset free text state when question changes
  useEffect(() => {
    setShowFreeText(false);
    setFreeText("");
  }, [questionIndex]);

  return (
    <div style={{
      background: C.bgComposer, borderRadius: 20, boxShadow: C.shadow,
      padding: "20px 24px",
    }}>
      {/* Progress dots + Skip */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          {Array.from({ length: totalQuestions }, (_, i) => (
            <div key={i} style={{
              width: i === questionIndex ? 24 : 8, height: 3, borderRadius: 2,
              background: i <= questionIndex ? C.accent : "rgba(222,220,209,0.15)",
              opacity: i < questionIndex ? 0.4 : 1,
              transition: "all 0.3s",
            }} />
          ))}
          <span style={{ fontSize: 11, color: C.textMuted, marginLeft: 8, fontFamily: C.sans }}>
            {questionIndex + 1} of {totalQuestions}
          </span>
        </div>
        <button onClick={onSkip} style={{
          background: "transparent", border: "none", color: C.textMuted,
          cursor: "pointer", fontSize: 12, fontFamily: C.sans,
          padding: "4px 8px", borderRadius: 6,
        }}
        onMouseOver={e => e.currentTarget.style.color = C.textSec}
        onMouseOut={e => e.currentTarget.style.color = C.textMuted}>
          Skip
        </button>
      </div>

      {/* Question title + description */}
      <div style={{ fontSize: 15, fontWeight: 500, color: C.text, marginBottom: 4, fontFamily: C.sans }}>
        {question.title}
      </div>
      {question.description && (
        <div style={{ fontSize: 13, color: C.textMuted, marginBottom: 16, lineHeight: 1.4, fontFamily: C.sans }}>
          {question.description}
        </div>
      )}

      {/* Options */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {question.options.map((opt, i) => (
          <button key={i} onClick={() => onSelect(`${opt.label}${opt.description ? ': ' + opt.description : ''}`)}
            style={{
              display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
              borderRadius: 10, border: `0.5px solid ${C.border}`, background: C.bg,
              cursor: "pointer", textAlign: "left", transition: "all 0.15s", fontFamily: C.sans,
            }}
            onMouseOver={e => { e.currentTarget.style.borderColor = "rgba(222,220,209,0.35)"; e.currentTarget.style.background = C.bgHover; }}
            onMouseOut={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.background = C.bg; }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.accent, flexShrink: 0, opacity: 0.7 }} />
            <div>
              <div style={{ color: C.text, fontSize: 13, fontWeight: 500 }}>{opt.label}</div>
              {opt.description && <div style={{ color: C.textMuted, fontSize: 11, marginTop: 1 }}>{opt.description}</div>}
            </div>
          </button>
        ))}
        {/* Free text option */}
        {!showFreeText ? (
          <button onClick={() => setShowFreeText(true)}
            style={{
              display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
              borderRadius: 10, border: `0.5px dashed ${C.border}`, background: "transparent",
              cursor: "pointer", textAlign: "left", transition: "all 0.15s", fontFamily: C.sans,
            }}
            onMouseOver={e => e.currentTarget.style.borderColor = "rgba(222,220,209,0.35)"}
            onMouseOut={e => e.currentTarget.style.borderColor = C.border}>
            <MessageSquare size={13} color={C.textMuted} style={{ flexShrink: 0 }} />
            <div style={{ color: C.textMuted, fontSize: 13 }}>Something else...</div>
          </button>
        ) : (
          <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
            <input value={freeText} onChange={e => setFreeText(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && freeText.trim()) onSelect(freeText.trim()); }}
              placeholder="Type your answer..."
              autoFocus
              style={{
                flex: 1, padding: "10px 14px", borderRadius: 10, border: `0.5px solid ${C.border}`,
                background: C.bg, color: C.text, fontSize: 13, fontFamily: C.sans, outline: "none",
              }} />
            <button onClick={() => { if (freeText.trim()) onSelect(freeText.trim()); }}
              disabled={!freeText.trim()}
              style={{
                padding: "10px 16px", borderRadius: 10, border: "none",
                background: freeText.trim() ? C.accent : C.bgHover,
                color: freeText.trim() ? "#fff" : C.textMuted,
                cursor: freeText.trim() ? "pointer" : "default",
                fontSize: 13, fontFamily: C.sans, fontWeight: 500, flexShrink: 0,
              }}>
              Send
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Seeded PRNG ────────────────────────────────────────────────────────────
const prng = (s) => { let seed = s; return () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }; };

const genStocks = () => {
  const r = prng(42), d = [];
  let a = 243, g = 196, m = 428, s = 596;
  for (let i = 0; i < 50; i++) {
    const mkt = (r() - 0.47) * 4;
    a += mkt * 1.3 + (r() - 0.5) * 3; g += mkt * 0.9 + (r() - 0.5) * 2;
    m += mkt * 1.1 + (r() - 0.5) * 3; s += mkt * 0.6 + (r() - 0.5) * 1.5;
    const dt = new Date(2025, 0, 2 + i);
    d.push({ Date: `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,"0")}-${String(dt.getDate()).padStart(2,"0")}`,
      AAPL: +a.toFixed(2), GOOGL: +g.toFixed(2), MSFT: +m.toFixed(2), SPY: +s.toFixed(2),
      Volume: Math.round(45e6 + r() * 35e6) });
  }
  return d;
};

const genResearch = () => {
  const r = prng(17), d = [];
  for (let i = 0; i < 40; i++) {
    const study = 1 + r() * 9, sleep = 4 + r() * 5, ex = r() * 6;
    const stress = Math.max(1, Math.min(10, 7.5 - study * 0.2 - sleep * 0.15 - ex * 0.3 + r() * 3.5));
    const gpa = Math.max(2.0, Math.min(4.0, 1.7 + study * 0.16 + sleep * 0.07 - stress * 0.05 + r() * 0.35));
    d.push({ Student_ID: `S${String(i+1).padStart(3,"0")}`, Study_Hours: +study.toFixed(1),
      Sleep_Hours: +sleep.toFixed(1), Exercise_Hours: +ex.toFixed(1),
      Stress_Level: +stress.toFixed(1), GPA: +gpa.toFixed(2) });
  }
  return d;
};

// ─── Stats ──────────────────────────────────────────────────────────────────
const mean = a => a.reduce((s,v) => s+v, 0) / a.length;
const median = a => { const s = [...a].sort((x,y) => x-y), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m-1]+s[m])/2; };
const std = a => { const m = mean(a); return Math.sqrt(a.reduce((s,v) => s+(v-m)**2, 0) / Math.max(1, a.length-1)); };
const corr = (x, y) => {
  const n = x.length, mx = mean(x), my = mean(y);
  let num = 0, dx2 = 0, dy2 = 0;
  for (let i = 0; i < n; i++) { const dx = x[i]-mx, dy = y[i]-my; num += dx*dy; dx2 += dx*dx; dy2 += dy*dy; }
  return dx2 && dy2 ? num / Math.sqrt(dx2 * dy2) : 0;
};
const linReg = (x, y) => {
  const mx = mean(x), my = mean(y);
  let num = 0, den = 0;
  for (let i = 0; i < x.length; i++) { num += (x[i]-mx)*(y[i]-my); den += (x[i]-mx)**2; }
  const slope = den ? num/den : 0, intercept = my - slope * mx;
  return { slope, intercept, r2: corr(x,y)**2 };
};
const getNumericCols = (data) => data?.length ? Object.keys(data[0]).filter(k => typeof data[0][k] === "number") : [];
const fmt = (v) => typeof v === "number" ? (Math.abs(v) >= 1000 ? v.toLocaleString(undefined, {maximumFractionDigits:2}) : v.toFixed(Math.abs(v) < 1 ? 4 : 2)) : v;

// ─── Build data context for API calls ─────────────────────────────────────
function buildDataContext(data, dsName) {
  if (!data || !data.length) return null;
  const nc = getNumericCols(data);
  const numericSummary = {};
  nc.forEach(col => {
    const vals = data.map(r => r[col]).filter(v => v != null && !isNaN(v));
    if (vals.length) {
      numericSummary[col] = {
        mean: +mean(vals).toFixed(4),
        median: +median(vals).toFixed(4),
        std: +std(vals).toFixed(4),
        min: +Math.min(...vals).toFixed(4),
        max: +Math.max(...vals).toFixed(4),
      };
    }
  });
  return {
    name: dsName,
    rowCount: data.length,
    columns: Object.keys(data[0]),
    numericSummary,
    sampleRows: data.slice(0, 5),
  };
}

// ─── Tooltip ────────────────────────────────────────────────────────────────
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: C.bgComposer, boxShadow: C.shadow, borderRadius: 10, padding: "10px 14px", fontSize: 12, fontFamily: C.sans, border: "none" }}>
      <div style={{ color: C.textMuted, marginBottom: 4, fontSize: 11 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || C.text, lineHeight: 1.6 }}>{p.name}: <span style={{ fontFamily: C.mono }}>{fmt(p.value)}</span></div>
      ))}
    </div>
  );
};

// ─── Card icons (matching Cowork style) ─────────────────────────────────────
const CardIcon1 = () => (
  <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
    <rect width="36" height="36" rx="8" fill="rgba(222,220,209,0.08)" />
    <path d="M10 24V14l8-4 8 4v10l-8 4-8-4z" stroke={C.textMuted} strokeWidth="1.2" fill="none" />
    <path d="M18 14v10M10 14l8 4 8-4" stroke={C.textMuted} strokeWidth="1.2" />
  </svg>
);
const CardIcon2 = () => (
  <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
    <rect width="36" height="36" rx="8" fill="rgba(222,220,209,0.08)" />
    <rect x="10" y="12" width="16" height="12" rx="2" stroke={C.textMuted} strokeWidth="1.2" fill="none" />
    <path d="M14 16h8M14 19h5" stroke={C.textMuted} strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);
const CardIcon3 = () => (
  <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
    <rect width="36" height="36" rx="8" fill="rgba(222,220,209,0.08)" />
    <circle cx="15" cy="16" r="3" stroke={C.textMuted} strokeWidth="1.2" fill="none" />
    <path d="M21 13l-3 3M21 19l-3-3M15 22v-3M15 13v-2" stroke={C.textMuted} strokeWidth="1.2" strokeLinecap="round" />
    <path d="M10 25h16" stroke={C.textMuted} strokeWidth="1.2" strokeLinecap="round" strokeDasharray="2 2" />
  </svg>
);
const CardIcon4 = () => (
  <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
    <rect width="36" height="36" rx="8" fill="rgba(222,220,209,0.08)" />
    <circle cx="16" cy="16" r="4" stroke={C.textMuted} strokeWidth="1.2" fill="none" />
    <path d="M16 10v-1M16 23v-1M10 16H9M23 16h-1M11.8 11.8l-.7-.7M20.9 20.9l-.7-.7M20.9 11.8l.7-.7M11.8 20.9l-.7-.7" stroke={C.textMuted} strokeWidth="1.2" strokeLinecap="round" />
    <path d="M20 22c1.5-1 3-1 4 0s1.5 2 3 2" stroke={C.textMuted} strokeWidth="1.2" strokeLinecap="round" fill="none" />
  </svg>
);

// ─── Pre-written prompts for task cards ──────────────────────────────────────
const PROMPTS = {
  trade: `Help me build and analyze a quantitative trading strategy for [US equities / ETFs / crypto / prediction markets / a specific sector or ticker]. I want to move beyond intuition and use data to find edges in the market.

First, ask me:
- What I'm trying to achieve (generate alpha, hedge a position, build a passive portfolio, backtest an idea I already have, or explore from scratch)
- My time horizon (intraday, swing trading, weeks/months, or long-term investing)
- Whether I have my own data to upload or want you to pull live market data
- My experience level with quantitative finance (so you can calibrate how much to explain)

Then, depending on my answers, start by either:
- Fetching recent price data for the tickers I'm interested in and running an initial statistical profile (returns distribution, volatility, correlations, momentum signals)
- Analyzing the CSV I upload with the same rigor

When backtesting any strategy, always show me: cumulative returns vs. benchmark, Sharpe ratio, max drawdown, win rate, and number of trades. Flag any signs of overfitting or lookahead bias. If the strategy looks too good, tell me why I should be skeptical.

If I don't have a specific idea yet, suggest 2-3 well-known quantitative strategies (e.g., momentum, mean reversion, pairs trading) and help me evaluate which might work for my situation.`,

  experiment: `Help me rigorously analyze experimental data from [a research study / clinical trial / A/B test / lab experiment / field study / survey]. I have results and I want to know what they actually mean — statistically and practically.

First, ask me:
- What hypothesis I was testing (or whether this is exploratory)
- The experimental design (randomized, paired, repeated measures, factorial, observational, etc.)
- What my outcome variable(s) and predictor variable(s) are
- Whether I have my data ready to upload or need help structuring it
- My comfort level with statistics (so you know whether to explain concepts like p-values and effect sizes or skip to the results)

Then start with a data quality check:
- Sample size per group
- Missing data (how much, any patterns)
- Distribution of key variables (normality, outliers, skew)
- Whether the groups were balanced at baseline

Choose statistical tests that match my design — don't default to a t-test if the data calls for something else. Explain *why* you chose each test in one sentence. Always report effect sizes alongside p-values, and tell me whether the result is practically meaningful, not just statistically significant.

If I ran multiple comparisons, flag it and apply appropriate corrections. If my sample is small, use exact or nonparametric methods and be honest about what the data can and can't tell us.

End with a plain-language summary I could put in a paper or present to a non-technical stakeholder.`,

  design: `Help me design a rigorous experiment to test [a product hypothesis / a scientific theory / a business decision / a treatment effect / a policy intervention / specify]. I have an idea about what might be true and I want to design a study that will actually give me a clear answer.

First, ask me:
- What my hypothesis is, in plain language (you'll help me sharpen it into something testable)
- The domain (product/tech, biomedical, social science, business, physical science, or other)
- What constraints I'm working with (budget, timeline, sample availability, ethical considerations)
- Whether I need to convince a specific audience with the results (investors, a journal, an IRB, a leadership team)
- My comfort level with experimental design and statistics (so you know how much to explain along the way)

Then help me build the experiment step by step:
1. Sharpen the hypothesis into a precise, falsifiable statement with a clearly defined primary outcome
2. Recommend an experimental design (RCT, quasi-experiment, factorial, crossover, etc.) and explain why it fits my situation
3. Identify the key confounders and how we'll control for them
4. Run a power analysis to determine the sample size I'll need — show me how the required n changes under different assumptions about effect size
5. Lay out the analysis plan I should pre-commit to before collecting any data

Be honest if my hypothesis is vague, my sample is too small, or my design has fatal flaws. I'd rather fix it now than after I've collected the data. If a full experiment isn't feasible, suggest a lighter-weight alternative (pilot study, natural experiment, observational analysis with appropriate caveats).`,

  weather: `Help me analyze and forecast weather patterns for [a specific city / region / event date / agricultural season / travel dates / specify]. I want to go beyond checking a weather app and actually understand what the data says about what's coming.

First, ask me:
- What I'm trying to plan for (outdoor event, travel, agricultural decisions, energy forecasting, pure curiosity, or something else)
- The location(s) and time horizon I care about (next 48 hours, next week, seasonal outlook, or historical patterns)
- Whether I have my own weather data to upload or want you to pull historical and forecast data
- How precise I need the answer to be (a general sense vs. specific probability thresholds, e.g., "less than 20% chance of rain")
- My comfort level with data science and statistics (so you know whether to walk through the methodology or just give me the results)

Then, depending on what I need:
- For short-term forecasts: pull recent weather data, show me the trend, and give me a probabilistic forecast with confidence intervals — not just "it will be 72°F" but "70-75°F with 85% confidence, with a 30% chance of afternoon precipitation"
- For historical analysis: fetch past data for my location and help me find seasonal patterns, anomalies, or long-term trends (e.g., "Is it actually raining more in October than it used to?")
- For event planning: combine historical base rates with recent trends to give me a data-driven risk assessment for my specific date and location

If a relevant prediction market exists (e.g., "hottest month on record," "hurricane landfall"), pull that data too and show me how crowd-sourced probabilities compare with the statistical model.

Be honest about the limits of weather forecasting — accuracy drops fast beyond 7-10 days. If I'm asking about something too far out, tell me what we *can* say and what's just noise.`,
};

// ═════════════════════════════════════════════════════════════════════════════
export default function ClaudeQuant() {
  const [data, setData] = useState(null);
  const [dsName, setDsName] = useState("");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [welcomeInput, setWelcomeInput] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true); // right sidebar (data panel)
  const [expanded, setExpanded] = useState({ info: true, vars: true, actions: true });
  const [conversationMode, setConversationMode] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [navOpen, setNavOpen] = useState(true); // left sidebar (session history)
  const [activeSession, setActiveSession] = useState("current");
  const [sessions] = useState([
    { id: "current", title: "Craft Anthropic dream job applicat...", active: true },
    { id: "s2", title: "Backtest momentum strategy on S&P..." },
    { id: "s3", title: "Analyze A/B test results for signu..." },
    { id: "s4", title: "Design RCT for drug trial sample s..." },
    { id: "s5", title: "Predict Bay Area rainfall patterns..." },
    { id: "s6", title: "Correlation analysis on student GP..." },
    { id: "s7", title: "Portfolio optimization with min va..." },
    { id: "s8", title: "Power analysis for clinical endpoi..." },
    { id: "s9", title: "Polymarket election model vs. poll..." },
    { id: "s10", title: "Outlier detection in sensor readin..." },
    { id: "s11", title: "ARIMA forecast for quarterly reven..." },
    { id: "s12", title: "Experiment design for pricing stra..." },
  ]);
  const scrollRef = useRef(null);
  const fileRef = useRef(null);
  const welcomeRef = useRef(null);
  const cardsRef = useRef(null);
  const abortRef = useRef(null);

  // Question overlay state: one-at-a-time flow
  const [pendingQuestions, setPendingQuestions] = useState([]);
  const [currentQIdx, setCurrentQIdx] = useState(0);
  const [questionAnswers, setQuestionAnswers] = useState([]);

  const numCols = useMemo(() => getNumericCols(data), [data]);
  const allCols = useMemo(() => data?.length ? Object.keys(data[0]) : [], [data]);

  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); }, [messages]);

  // Auto-resize textarea when prompt is populated by task card click
  useEffect(() => {
    if (welcomeRef.current) {
      welcomeRef.current.style.height = "auto";
      let maxH = 240;
      if (cardsRef.current) {
        const cardsBottom = cardsRef.current.getBoundingClientRect().bottom;
        const viewportH = window.innerHeight;
        maxH = Math.max(120, viewportH - cardsBottom - 48 - 80);
      }
      const naturalH = welcomeRef.current.scrollHeight;
      if (naturalH <= maxH) {
        welcomeRef.current.style.height = naturalH + "px";
        welcomeRef.current.style.overflow = "hidden";
      } else {
        welcomeRef.current.style.height = maxH + "px";
        welcomeRef.current.style.overflow = "auto";
      }
    }
  }, [welcomeInput]);

  // ── Stream a message to the Claude API ──
  const streamMessage = useCallback(async (userText, existingMessages = []) => {
    if (!userText.trim() || isStreaming) return;

    const userMsg = { role: "user", text: userText, content: userText };
    const updatedMessages = [...existingMessages, userMsg];

    // Add user message + empty assistant placeholder
    setMessages([...updatedMessages, { role: "assistant", text: "", isStreaming: true }]);
    setIsStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      // Build conversation history for API (only role + content)
      const apiMessages = updatedMessages.map(m => ({
        role: m.role,
        content: m.content || m.text || "",
      }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: apiMessages,
          dataContext: buildDataContext(data, dsName),
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Request failed" }));
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice(6).trim();
          if (payload === "[DONE]") break;

          try {
            const data = JSON.parse(payload);
            if (data.type === "text") {
              fullText += data.text;
              setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                  role: "assistant",
                  text: getDisplayText(fullText),
                  content: fullText,
                  isStreaming: true,
                };
                return updated;
              });
            } else if (data.type === "error") {
              throw new Error(data.error);
            }
          } catch (parseErr) {
            if (parseErr instanceof SyntaxError) continue;
            throw parseErr;
          }
        }
      }

      // Finalize: detect questions and set up overlay if present
      const parsed = parseMessageContent(fullText);
      const questions = parsed.segments.filter(s => s.type === "question");
      const displayText = getDisplayText(fullText);

      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          text: displayText,
          content: fullText,
          isStreaming: false,
        };
        return updated;
      });

      if (questions.length > 0) {
        setPendingQuestions(questions);
        setCurrentQIdx(0);
        setQuestionAnswers([]);
      }
    } catch (err) {
      if (err.name === "AbortError") {
        setMessages(prev => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last?.role === "assistant") {
            updated[updated.length - 1] = { ...last, isStreaming: false };
          }
          return updated;
        });
      } else {
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "assistant",
            text: `Something went wrong: ${err.message}. Please try again.`,
            content: `Something went wrong: ${err.message}. Please try again.`,
            isStreaming: false,
            isError: true,
          };
          return updated;
        });
      }
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  }, [isStreaming, data, dsName]);

  const stopStreaming = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  // ── Question overlay handlers: answer or skip, batch all answers ──
  const handleQuestionAnswer = useCallback((answer) => {
    const question = pendingQuestions[currentQIdx];
    const newAnswers = [...questionAnswers, { title: question.title, answer }];
    setQuestionAnswers(newAnswers);

    if (currentQIdx + 1 < pendingQuestions.length) {
      setCurrentQIdx(prev => prev + 1);
    } else {
      // All questions answered — combine and send as one message
      const combinedText = newAnswers
        .filter(a => a.answer !== null)
        .map(a => `**${a.title}**: ${a.answer}`)
        .join('\n');
      setPendingQuestions([]);
      setCurrentQIdx(0);
      setQuestionAnswers([]);
      if (combinedText.trim()) {
        streamMessage(combinedText, messages);
      }
    }
  }, [pendingQuestions, currentQIdx, questionAnswers, messages, streamMessage]);

  const handleQuestionSkip = useCallback(() => {
    const newAnswers = [...questionAnswers, { title: pendingQuestions[currentQIdx].title, answer: null }];
    setQuestionAnswers(newAnswers);

    if (currentQIdx + 1 < pendingQuestions.length) {
      setCurrentQIdx(prev => prev + 1);
    } else {
      // All done — send any non-skipped answers
      const combinedText = newAnswers
        .filter(a => a.answer !== null)
        .map(a => `**${a.title}**: ${a.answer}`)
        .join('\n');
      setPendingQuestions([]);
      setCurrentQIdx(0);
      setQuestionAnswers([]);
      if (combinedText.trim()) {
        streamMessage(combinedText, messages);
      }
      // If all skipped, just return to normal composer
    }
  }, [pendingQuestions, currentQIdx, questionAnswers, messages, streamMessage]);

  // ── Local analysis logic (for CSV data) ──
  const buildInitialAnalysis = (d, name) => {
    const nc = getNumericCols(d);
    const msgs = [];
    msgs.push({ role: "assistant", text: `I've loaded **${name}** — ${d.length} rows and ${Object.keys(d[0]).length} columns. Let me run an initial analysis.` });
    const stats = nc.map(c => {
      const vals = d.map(r => r[c]).filter(v => v != null && !isNaN(v));
      return { col: c, mean: mean(vals), median: median(vals), std: std(vals), min: Math.min(...vals), max: Math.max(...vals) };
    });
    msgs.push({ role: "assistant", text: "Statistical overview:", table: { headers: ["Variable", "Mean", "Median", "Std Dev", "Min", "Max"], rows: stats.map(s => [s.col, fmt(s.mean), fmt(s.median), fmt(s.std), fmt(s.min), fmt(s.max)]) } });
    if (nc.length >= 2) {
      const pairs = [];
      for (let i = 0; i < nc.length; i++) for (let j = i+1; j < nc.length; j++) {
        const vx = d.map(r => r[nc[i]]).filter(v => v != null && !isNaN(v));
        const vy = d.map(r => r[nc[j]]).filter(v => v != null && !isNaN(v));
        const minLen = Math.min(vx.length, vy.length);
        if (minLen > 5) pairs.push({ a: nc[i], b: nc[j], r: corr(vx.slice(0, minLen), vy.slice(0, minLen)) });
      }
      pairs.sort((a, b) => Math.abs(b.r) - Math.abs(a.r));
      const top = pairs.slice(0, 3);
      if (top.length) {
        const s = top[0], dir = s.r > 0 ? "positive" : "negative";
        msgs.push({ role: "assistant", text: `**Key correlation:** **${s.a}** and **${s.b}** (r = ${s.r.toFixed(3)}, ${dir}).`, chip: top.map(p => `${p.a} ↔ ${p.b}: ${p.r.toFixed(2)}`) });
      }
    }
    const hasDate = Object.keys(d[0]).some(k => k.toLowerCase().includes("date"));
    if (hasDate && nc.length >= 1) {
      msgs.push({ role: "assistant", text: "Trend over time:", chart: { type: "area", data: d, keys: nc.filter(c => !c.toLowerCase().includes("volume")).slice(0, 4) } });
    } else if (nc.length >= 2) {
      msgs.push({ role: "assistant", text: `**${nc[0]}** vs **${nc[1]}**:`, chart: { type: "scatter", data: d, x: nc[0], y: nc[1] } });
    }
    msgs.push({ role: "assistant", text: "What would you like to explore? Ask me anything about this dataset, or try one of these:", suggestions: ["Show correlation matrix", "Distribution of " + (nc[0] || ""), "Predict " + (nc[nc.length-1] || ""), "Compare all variables"] });
    return msgs;
  };

  const loadDataset = (type) => {
    const d = type === "stocks" ? genStocks() : genResearch();
    const name = type === "stocks" ? "Market Data (AAPL, GOOGL, MSFT, SPY)" : "Student Research Data";
    setData(d); setDsName(name); setMessages(buildInitialAnalysis(d, name));
  };

  // ── Task card handler: populates composer with pre-written prompt ──
  const handleTaskCard = (promptKey) => {
    setWelcomeInput(PROMPTS[promptKey] || "");
    setTimeout(() => welcomeRef.current?.focus(), 50);
  };

  const handleWelcomeSubmit = (e) => {
    e?.preventDefault();
    const prompt = welcomeInput.trim();
    if (!prompt) {
      loadDataset("stocks");
      return;
    }
    // Enter conversation mode and stream the response from Claude
    setConversationMode(true);
    setWelcomeInput("");
    streamMessage(prompt, []);
  };

  const handleCSV = (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = Papa.parse(ev.target.result, { header: true, dynamicTyping: true, skipEmptyLines: true });
      if (result.data?.length) { setData(result.data); setDsName(file.name); setMessages(buildInitialAnalysis(result.data, file.name)); }
    };
    reader.readAsText(file);
  };

  // ── Process query: local analysis for data operations, API for everything else ──
  const processQuery = (query) => {
    const q = query.toLowerCase();

    // Handle actions that don't require data
    if (q.includes("upload a csv") || q.includes("upload csv")) { fileRef.current?.click(); return; }
    if (q.includes("sample data") || q.includes("market equities") || q.includes("load market")) { loadDataset("stocks"); return; }
    if (q.includes("research study") || q.includes("load research")) { loadDataset("research"); return; }

    // If we have data and the query matches a local analysis pattern, do it client-side (fast)
    if (data) {
      const nc = getNumericCols(data);
      const mentioned = nc.filter(c => q.includes(c.toLowerCase()));

      if (q.includes("correlat") || q.includes("heatmap") || q.includes("matrix")) {
        const matrix = nc.map(c1 => nc.map(c2 => {
          const v1 = data.map(r => r[c1]).filter(v => v != null && !isNaN(v));
          const v2 = data.map(r => r[c2]).filter(v => v != null && !isNaN(v));
          return corr(v1.slice(0, Math.min(v1.length, v2.length)), v2.slice(0, Math.min(v1.length, v2.length)));
        }));
        setMessages(prev => [...prev, { role: "user", text: query }, { role: "assistant", text: "Full correlation matrix:", chart: { type: "heatmap", labels: nc, matrix } }]);
        return;
      } else if (q.includes("distribut") || q.includes("histogram")) {
        const col = mentioned[0] || nc[0];
        const vals = data.map(r => r[col]).filter(v => v != null && !isNaN(v));
        const mn = Math.min(...vals), mx = Math.max(...vals), bins = 12, bw = (mx - mn) / bins || 1;
        const hist = Array.from({ length: bins }, (_, i) => { const lo = mn + i * bw, hi = lo + bw; return { range: `${lo.toFixed(1)}`, count: vals.filter(v => v >= lo && (i === bins-1 ? v <= hi : v < hi)).length }; });
        setMessages(prev => [...prev, { role: "user", text: query }, { role: "assistant", text: `Distribution of **${col}** — mean: ${fmt(mean(vals))}, std: ${fmt(std(vals))}`, chart: { type: "bar", data: hist, x: "range", y: "count" } }]);
        return;
      } else if (q.includes("scatter") || q.includes("relationship") || q.includes(" vs ") || q.includes("versus")) {
        const cx = mentioned[0] || nc[0], cy = mentioned[1] || nc[1];
        if (cx && cy) { const r = corr(data.map(d => d[cx]).filter(v => !isNaN(v)), data.map(d => d[cy]).filter(v => !isNaN(v))); setMessages(prev => [...prev, { role: "user", text: query }, { role: "assistant", text: `**${cx}** vs **${cy}** — r = ${r.toFixed(3)}`, chart: { type: "scatter", data, x: cx, y: cy } }]); }
        return;
      } else if (q.includes("trend") || q.includes("time") || q.includes("line") || q.includes("over time")) {
        const keys = mentioned.length ? mentioned : nc.filter(c => !c.toLowerCase().includes("volume") && !c.toLowerCase().includes("id")).slice(0, 4);
        setMessages(prev => [...prev, { role: "user", text: query }, { role: "assistant", text: `Trend for ${keys.join(", ")}:`, chart: { type: "area", data, keys } }]);
        return;
      } else if (q.includes("predict") || q.includes("regress") || q.includes("forecast")) {
        const target = mentioned[0] || nc[nc.length - 1], predictor = mentioned[1] || nc.find(c => c !== target) || nc[0];
        const vx = data.map(r => r[predictor]).filter(v => !isNaN(v)), vy = data.map(r => r[target]).filter(v => !isNaN(v));
        const minLen = Math.min(vx.length, vy.length), reg = linReg(vx.slice(0, minLen), vy.slice(0, minLen));
        const predData = data.map(r => ({ ...r, predicted: +(reg.intercept + reg.slope * r[predictor]).toFixed(2) }));
        setMessages(prev => [...prev, { role: "user", text: query }, { role: "assistant", text: `**Regression:** ${target} = ${reg.slope.toFixed(4)} × ${predictor} + ${reg.intercept.toFixed(2)}\nR² = ${reg.r2.toFixed(4)}`, chart: { type: "regression", data: predData, x: predictor, y: target, predicted: "predicted" } }]);
        return;
      } else if (q.includes("compar") || q.includes("all") || q.includes("overview") || q.includes("summary")) {
        const stats = nc.map(c => { const vals = data.map(r => r[c]).filter(v => v != null && !isNaN(v)); return { col: c, mean: mean(vals), median: median(vals), std: std(vals), min: Math.min(...vals), max: Math.max(...vals) }; });
        setMessages(prev => [...prev, { role: "user", text: query }, { role: "assistant", text: "Complete summary:", table: { headers: ["Variable", "Mean", "Median", "Std Dev", "Min", "Max"], rows: stats.map(s => [s.col, fmt(s.mean), fmt(s.median), fmt(s.std), fmt(s.min), fmt(s.max)]) } }]);
        return;
      } else if (q.includes("outlier") || q.includes("anomal")) {
        const col = mentioned[0] || nc[0], vals = data.map(r => r[col]).filter(v => !isNaN(v));
        const m = mean(vals), s = std(vals), outliers = data.filter(r => Math.abs(r[col] - m) > 2 * s);
        setMessages(prev => [...prev, { role: "user", text: query }, { role: "assistant", text: `**Outlier detection for ${col}** (±2σ): ${outliers.length} outlier${outliers.length !== 1 ? "s" : ""} / ${data.length} observations.` }]);
        return;
      }
    }

    // For everything else (open-ended questions, analysis requests, etc.) → stream from Claude API
    streamMessage(query, messages);
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (input.trim() && !isStreaming) {
      processQuery(input.trim());
      setInput("");
    }
  };

  // ── Charts ──
  const renderChart = (chart) => {
    const h = 260, ax = { fontSize: 11, fill: C.textMuted, fontFamily: C.sans }, gc = "rgba(222,220,209,0.08)";
    if (chart.type === "area") return <ResponsiveContainer width="100%" height={h}><AreaChart data={chart.data} margin={{top:10,right:16,bottom:4,left:8}}><CartesianGrid stroke={gc} strokeDasharray="3 3"/><XAxis dataKey={Object.keys(chart.data[0])[0]} tick={ax} interval={Math.floor(chart.data.length/6)}/><YAxis tick={ax}/><Tooltip content={<ChartTooltip/>}/>{chart.keys.map((k,i)=><Area key={k} type="monotone" dataKey={k} stroke={C.chart[i%C.chart.length]} fill={C.chart[i%C.chart.length]} fillOpacity={0.06} strokeWidth={2} dot={false}/>)}</AreaChart></ResponsiveContainer>;
    if (chart.type === "scatter") return <ResponsiveContainer width="100%" height={h}><ScatterChart margin={{top:10,right:16,bottom:4,left:8}}><CartesianGrid stroke={gc} strokeDasharray="3 3"/><XAxis dataKey={chart.x} name={chart.x} tick={ax} type="number"/><YAxis dataKey={chart.y} name={chart.y} tick={ax} type="number"/><Tooltip content={<ChartTooltip/>}/><Scatter data={chart.data} fill={C.accent} fillOpacity={0.75} r={4}/></ScatterChart></ResponsiveContainer>;
    if (chart.type === "bar") return <ResponsiveContainer width="100%" height={h}><BarChart data={chart.data} margin={{top:10,right:16,bottom:4,left:8}}><CartesianGrid stroke={gc} strokeDasharray="3 3"/><XAxis dataKey={chart.x} tick={ax} interval={1}/><YAxis tick={ax}/><Tooltip content={<ChartTooltip/>}/><Bar dataKey={chart.y} fill={C.accent} fillOpacity={0.85} radius={[3,3,0,0]}/></BarChart></ResponsiveContainer>;
    if (chart.type === "regression") return <ResponsiveContainer width="100%" height={h}><ScatterChart margin={{top:10,right:16,bottom:4,left:8}}><CartesianGrid stroke={gc} strokeDasharray="3 3"/><XAxis dataKey={chart.x} name={chart.x} tick={ax} type="number"/><YAxis dataKey={chart.y} name={chart.y} tick={ax} type="number"/><Tooltip content={<ChartTooltip/>}/><Scatter data={chart.data} fill={C.accent} fillOpacity={0.6} r={4}/><Scatter data={[...chart.data].sort((a,b)=>a[chart.x]-b[chart.x])} dataKey={chart.predicted} fill="none" line={{stroke:C.blue,strokeWidth:2}} r={0}/></ScatterChart></ResponsiveContainer>;
    if (chart.type === "heatmap") { const n=chart.labels.length; return <div style={{overflowX:"auto"}}><div style={{display:"grid",gridTemplateColumns:`90px repeat(${n},1fr)`,gap:2,fontSize:11,minWidth:n*56+90}}><div/>{chart.labels.map(l=><div key={l} style={{color:C.textMuted,textAlign:"center",padding:"6px 2px",fontFamily:C.mono,fontSize:10,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{l}</div>)}{chart.labels.map((r,i)=>[<div key={`r-${i}`} style={{color:C.textMuted,padding:"6px 4px",textAlign:"right",fontFamily:C.mono,fontSize:10}}>{r}</div>,...chart.matrix[i].map((v,j)=>{const abs=Math.abs(v);const bg=v>0?`rgba(125,186,109,${abs*0.5})`:v<0?`rgba(207,107,99,${abs*0.5})`:"transparent";return<div key={`${i}-${j}`} style={{background:bg,color:abs>0.25?C.text:C.textMuted,textAlign:"center",padding:6,borderRadius:4,fontFamily:C.mono,fontWeight:i===j?600:400,fontSize:11}}>{v.toFixed(2)}</div>;})])}</div></div>; }
    return null;
  };

  const renderText = (text) => {
    if (!text) return null;
    return text.split(/(\*\*[^*]+\*\*)/g).map((p,i) => p.startsWith("**") && p.endsWith("**") ? <strong key={i} style={{color:C.text,fontWeight:600}}>{p.slice(2,-2)}</strong> : <span key={i}>{p}</span>);
  };

  // ═════════════════════════════ RENDER ══════════════════════════════════════
  return (
    <div style={{ display: "flex", height: "100vh", background: C.bg, color: C.text, fontFamily: C.sans, overflow: "hidden" }}>

      {/* ═══ LEFT NAV SIDEBAR ═══ */}
      {navOpen && (
        <div style={{ width: 220, flexShrink: 0, background: C.bgDeep, display: "flex", flexDirection: "column", borderRight: `0.5px solid ${C.border}`, zIndex: 10 }}>
          {/* Top controls */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 12px 8px" }}>
            <button onClick={() => setNavOpen(false)} style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, borderRadius: 6, border: "none", background: "transparent", color: C.textMuted, cursor: "pointer" }}
              onMouseOver={e => e.currentTarget.style.background = "rgba(156,154,146,0.1)"} onMouseOut={e => e.currentTarget.style.background = "transparent"}>
              <PanelLeft size={16} />
            </button>
            <div style={{ display: "flex", gap: 4 }}>
              <button style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, borderRadius: 6, border: "none", background: "transparent", color: C.textMuted, cursor: "pointer", fontSize: 13 }}
                onMouseOver={e => e.currentTarget.style.background = "rgba(156,154,146,0.1)"} onMouseOut={e => e.currentTarget.style.background = "transparent"}>
                <ArrowRight size={14} style={{ transform: "rotate(180deg)" }} />
              </button>
              <button style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, borderRadius: 6, border: "none", background: "transparent", color: C.textMuted, cursor: "pointer" }}
                onMouseOver={e => e.currentTarget.style.background = "rgba(156,154,146,0.1)"} onMouseOut={e => e.currentTarget.style.background = "transparent"}>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>

          {/* New task + Search */}
          <div style={{ padding: "4px 8px" }}>
            <button style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "7px 8px", borderRadius: 6, border: "none", background: "transparent", color: C.text, cursor: "pointer", fontSize: 13, fontFamily: C.sans, fontWeight: 400 }}
              onMouseOver={e => e.currentTarget.style.background = "rgba(156,154,146,0.1)"} onMouseOut={e => e.currentTarget.style.background = "transparent"}>
              <Plus size={14} color={C.textMuted} /> New task
            </button>
            <button style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "7px 8px", borderRadius: 6, border: "none", background: "transparent", color: C.textSec, cursor: "pointer", fontSize: 13, fontFamily: C.sans }}
              onMouseOver={e => e.currentTarget.style.background = "rgba(156,154,146,0.1)"} onMouseOut={e => e.currentTarget.style.background = "transparent"}>
              <Search size={14} color={C.textMuted} /> Search
            </button>
          </div>

          {/* Recents label */}
          <div style={{ padding: "12px 16px 6px", fontSize: 11, color: C.textMuted, fontWeight: 500, letterSpacing: 0.3 }}>Recents</div>

          {/* Session list */}
          <div style={{ flex: 1, overflowY: "auto", padding: "0 8px" }}>
            {sessions.map(s => (
              <button key={s.id} onClick={() => setActiveSession(s.id)}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: "7px 8px",
                  borderRadius: 6, border: "none", cursor: "pointer", fontSize: 13, fontFamily: C.sans, textAlign: "left",
                  background: activeSession === s.id ? "rgba(156,154,146,0.1)" : "transparent",
                  color: activeSession === s.id ? C.text : C.textSec,
                }}
                onMouseOver={e => { if (activeSession !== s.id) e.currentTarget.style.background = "rgba(156,154,146,0.06)"; }}
                onMouseOut={e => { if (activeSession !== s.id) e.currentTarget.style.background = "transparent"; }}>
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{s.title}</span>
                {activeSession === s.id && <MoreHorizontal size={14} color={C.textMuted} style={{ flexShrink: 0, marginLeft: 4 }} />}
              </button>
            ))}
          </div>

          {/* Bottom section */}
          <div style={{ borderTop: `0.5px solid ${C.border}`, padding: "8px" }}>
            <div style={{ padding: "8px 8px 12px", fontSize: 11, color: C.textMuted, lineHeight: 1.4 }}>
              These tasks run ephemerally and are not saved across sessions
            </div>
            <button style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "7px 8px", borderRadius: 6, border: "none", background: "transparent", color: C.textSec, cursor: "pointer", fontSize: 13, fontFamily: C.sans }}
              onMouseOver={e => e.currentTarget.style.background = "rgba(156,154,146,0.1)"} onMouseOut={e => e.currentTarget.style.background = "transparent"}>
              Plugins
            </button>
            {/* User profile */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 8px 4px" }}>
              <div style={{ width: 24, height: 24, borderRadius: 6, background: C.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 600, color: "#fff" }}>D</div>
              <span style={{ fontSize: 13, color: C.text }}>Dev</span>
            </div>
          </div>
        </div>
      )}

      {/* ═══ MAIN CONTENT AREA ═══ */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", position: "relative", overflow: "hidden" }}>
        {/* Grid background */}
        <div style={{ position: "absolute", inset: 0, backgroundImage: C.grid, backgroundSize: "32px 32px", pointerEvents: "none", zIndex: 0 }} />

        {/* Top bar: nav toggle + mode switcher */}
        <div style={{ position: "relative", zIndex: 2, display: "flex", alignItems: "center", padding: "12px 16px 0" }}>
          {!navOpen && (
            <button onClick={() => setNavOpen(true)} style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, borderRadius: 6, border: "none", background: "transparent", color: C.textMuted, cursor: "pointer", marginRight: 8 }}
              onMouseOver={e => e.currentTarget.style.background = "rgba(156,154,146,0.1)"} onMouseOut={e => e.currentTarget.style.background = "transparent"}>
              <PanelLeft size={16} />
            </button>
          )}
          {/* Centered mode switcher */}
          <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 2, background: C.bgComposer, borderRadius: 10, padding: 3, border: `0.5px solid ${C.border}` }}>
              {["Code", "Cowork", "Chat", "Quant"].map(mode => {
                const isActive = mode === "Quant";
                const isDisabled = mode !== "Quant";
                return (
                  <button key={mode}
                    disabled={isDisabled}
                    style={{
                      padding: "5px 16px",
                      borderRadius: 8,
                      border: "none",
                      background: isActive ? C.bg : "transparent",
                      color: isActive ? C.text : C.textMuted,
                      fontSize: 13,
                      fontWeight: isActive ? 500 : 400,
                      fontFamily: C.sans,
                      cursor: isDisabled ? "default" : "pointer",
                      opacity: isDisabled ? 0.4 : 1,
                      transition: "all 0.15s",
                      boxShadow: isActive ? C.shadowSoft : "none",
                      letterSpacing: 0.1,
                    }}>
                    {mode}
                  </button>
                );
              })}
            </div>
          </div>
          {!navOpen && <div style={{ width: 36 }} />}
        </div>

        <input ref={fileRef} type="file" accept=".csv,.tsv,.txt" onChange={handleCSV} style={{ display: "none" }} />

      {!data && !conversationMode ? (
        /* ═══ WELCOME SCREEN (Cowork layout) ═══ */
        <div style={{ position: "relative", zIndex: 1, flex: 1, display: "flex", flexDirection: "column", padding: "28px 64px 32px", maxWidth: 900, margin: "0 auto", width: "100%", overflowY: "auto" }}>
          <ClaudeLogo size={48} />
          <h1 style={{ fontFamily: C.serif, fontStyle: "italic", fontWeight: 290, fontSize: 42, color: C.text, marginTop: 12, marginBottom: 28, letterSpacing: -0.5, lineHeight: 1.15 }}>
            Find the story hidden in the numbers
          </h1>

          {/* Info banner */}
          <div style={{ background: C.bgComposer, borderRadius: 16, border: `0.5px solid ${C.border}`, padding: "16px 20px", marginBottom: 24, display: "flex", alignItems: "flex-start", gap: 12, boxShadow: C.shadowSoft }}>
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
              <path d="M10 2L2 18h16L10 2z" stroke={C.textMuted} strokeWidth="1.2" fill="none" />
              <path d="M10 8v4M10 14v1" stroke={C.textMuted} strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <span style={{ color: C.textSec, fontSize: 14, lineHeight: 1.5 }}>
              ClaudeQuant is an early product prototype. Quant acts as a PhD-level data scientist, helping you understand the world through the past (e.g., design experiments, analyze data statistically rigorously) and predict the future through that understanding (e.g., extrapolate models, build algorithmic or probabilistic predictors). Upload a CSV or any quantitative dataset and Claude will work with you to find the story hidden in the numbers.
            </span>
          </div>

          {/* Task cards section */}
          <div ref={cardsRef} style={{ background: C.bgComposer, borderRadius: 16, border: `0.5px solid ${C.border}`, padding: "20px 24px", marginBottom: 24, boxShadow: C.shadowSoft }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 6l4-4 4 4M4 10l4 4 4-4" stroke={C.textMuted} strokeWidth="1.2" strokeLinecap="round"/></svg>
                <span style={{ color: C.text, fontSize: 14, fontWeight: 500 }}>What will you discover?</span>
              </div>
              <button onClick={() => fileRef.current?.click()} style={{ background: "transparent", border: "none", color: C.textMuted, cursor: "pointer", fontSize: 13, fontFamily: C.sans, display: "flex", alignItems: "center", gap: 4 }}
                onMouseOver={e => e.currentTarget.style.color = C.textSec} onMouseOut={e => e.currentTarget.style.color = C.textMuted}>
                + Upload your own
              </button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {[
                { icon: <CardIcon1 />, label: "Trade the market quantitatively", sub: "Backtest strategies, analyze equities, build signals", action: () => handleTaskCard("trade") },
                { icon: <CardIcon2 />, label: "Analyze experimental data", sub: "Statistical tests, significance, effect sizes", action: () => handleTaskCard("experiment") },
                { icon: <CardIcon3 />, label: "Design experiments to test hypotheses", sub: "Power analysis, sample sizes, controls", action: () => handleTaskCard("design") },
                { icon: <CardIcon4 />, label: "Predict the weather", sub: "Time series, forecasting, probabilistic models", action: () => handleTaskCard("weather") },
              ].map((card, i) => (
                <button key={i} onClick={card.action}
                  style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderRadius: 12, border: `0.5px solid ${C.border}`, background: C.bg, cursor: "pointer", textAlign: "left", transition: "all 0.15s", fontFamily: C.sans }}
                  onMouseOver={e => e.currentTarget.style.borderColor = "rgba(222,220,209,0.35)"} onMouseOut={e => e.currentTarget.style.borderColor = C.border}>
                  {card.icon}
                  <div>
                    <div style={{ color: C.text, fontWeight: 500, fontSize: 13, marginBottom: 2 }}>{card.label}</div>
                    <div style={{ color: C.textMuted, fontSize: 11 }}>{card.sub}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Composer input */}
          <div style={{ marginTop: "auto", flexShrink: 0 }}>
            <form onSubmit={handleWelcomeSubmit}>
              <div style={{ background: C.bgComposer, borderRadius: 20, boxShadow: C.shadow, padding: "16px 20px 12px" }}>
                <textarea ref={welcomeRef} value={welcomeInput} onChange={e => setWelcomeInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleWelcomeSubmit(e); } }}
                  placeholder="Describe your data analysis goal..."
                  rows={1}
                  style={{ width: "100%", background: "transparent", border: "none", outline: "none", color: C.text, fontSize: 14, padding: 0, marginBottom: 12, fontFamily: C.sans, lineHeight: 1.6, resize: "none", overflow: "hidden" }} />
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <button type="button" onClick={() => fileRef.current?.click()} style={{ display: "flex", alignItems: "center", gap: 6, background: "transparent", border: "none", color: C.textMuted, cursor: "pointer", fontSize: 13, fontFamily: C.sans }}>
                      <Upload size={14} /> Upload CSV
                      <ChevronDown size={12} />
                    </button>
                    <span style={{ color: C.textMuted, fontSize: 16, cursor: "pointer" }}>+</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ color: C.textMuted, fontSize: 13, fontFamily: C.sans }}>Powered by Claude <ChevronDown size={11} style={{ display: "inline", verticalAlign: "middle" }} /></span>
                    <button type="submit"
                      style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 18px", borderRadius: 20, border: "none", background: C.accent, color: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 500, fontFamily: C.sans, transition: "background 0.15s" }}
                      onMouseOver={e => e.currentTarget.style.background = C.accentHover} onMouseOut={e => e.currentTarget.style.background = C.accent}>
                      Let's crunch! <ArrowRight size={15} />
                    </button>
                  </div>
                </div>
              </div>
            </form>
            <div style={{ textAlign: "center", padding: "8px 0 0", fontSize: 12, color: C.textMuted, fontFamily: C.sans }}>
              Claude is AI and can make mistakes. Please double-check responses. <span style={{ textDecoration: "underline", cursor: "pointer" }}>Give us feedback</span>
            </div>
          </div>
        </div>
      ) : (
        /* ═══ ANALYSIS VIEW ═══ */
        <div style={{ position: "relative", zIndex: 1, display: "flex", flex: 1, overflow: "hidden" }}>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 20px", flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <ClaudeLogo size={22} />
                <span style={{ fontSize: 16, fontWeight: 500 }}>Claude<span style={{ fontWeight: 300, color: C.accent }}>Quant</span></span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button onClick={() => fileRef.current?.click()} style={{ padding: "5px 12px", borderRadius: 8, border: `0.5px solid ${C.border}`, background: "transparent", color: C.textSec, cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}
                  onMouseOver={e => e.currentTarget.style.background = C.bgHover} onMouseOut={e => e.currentTarget.style.background = "transparent"}>
                  <Upload size={13} /> Upload
                </button>
                {data && <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ padding: "5px 8px", borderRadius: 8, border: `0.5px solid ${C.border}`, background: "transparent", color: C.textSec, cursor: "pointer" }}
                  onMouseOver={e => e.currentTarget.style.background = C.bgHover} onMouseOut={e => e.currentTarget.style.background = "transparent"}>
                  {sidebarOpen ? <X size={14} /> : <Database size={14} />}
                </button>}
              </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: "24px 32px" }}>
              <div style={{ maxWidth: 720, margin: "0 auto" }}>
                {messages.map((msg, i) => (
                  <div key={i} style={{ marginBottom: 24 }}>
                    {msg.role === "user" ? (
                      <div style={{ display: "flex", justifyContent: "flex-end" }}>
                        <div style={{ maxWidth: "75%", background: C.bgComposer, borderRadius: 18, padding: "10px 16px", boxShadow: C.shadowSoft }}>
                          <div style={{ fontSize: 14, lineHeight: 1.6, color: C.text, fontFamily: C.serif }}>{msg.text}</div>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                        <div style={{ flexShrink: 0, marginTop: 3 }}><ClaudeLogo size={18} /></div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          {/* Render clean text (questions are stripped and shown as overlay) */}
                          {msg.text && (
                            <div style={{ fontSize: 14, lineHeight: 1.7, color: C.textSec, whiteSpace: "pre-wrap", fontFamily: C.serif }}>
                              {renderText(msg.text)}{msg.isStreaming && <StreamingDots />}
                            </div>
                          )}
                          {!msg.text && msg.isStreaming && <div style={{ fontSize: 14, color: C.textMuted }}><StreamingDots /></div>}
                          {msg.isError && <div style={{ color: C.red, fontSize: 12, marginTop: 4 }}>Error occurred</div>}
                          {msg.table && <div style={{ overflowX: "auto", marginTop: 14, background: C.bgComposer, borderRadius: 12, boxShadow: C.shadowSoft, padding: "4px 0" }}><table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}><thead><tr>{msg.table.headers.map((h,j) => <th key={j} style={{ padding: "10px 14px", textAlign: j===0?"left":"right", color: C.textMuted, borderBottom: `1px solid ${C.border}`, fontWeight: 500, fontFamily: C.sans, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5 }}>{h}</th>)}</tr></thead><tbody>{msg.table.rows.map((row,j) => <tr key={j}>{row.map((cell,k) => <td key={k} style={{ padding: "8px 14px", textAlign: k===0?"left":"right", color: k===0?C.text:C.textSec, fontFamily: k>0?C.mono:C.sans, fontSize: 12, borderBottom: j<msg.table.rows.length-1?`1px solid rgba(222,220,209,0.06)`:"none" }}>{cell}</td>)}</tr>)}</tbody></table></div>}
                          {msg.chart && <div style={{ marginTop: 14, background: C.bgComposer, borderRadius: 12, boxShadow: C.shadowSoft, padding: "16px 8px 8px 0" }}>{renderChart(msg.chart)}</div>}
                          {msg.chip && <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>{msg.chip.map((c,j) => <span key={j} style={{ padding: "4px 10px", borderRadius: 6, background: "rgba(156,154,146,0.1)", fontSize: 12, color: C.textMuted, fontFamily: C.mono }}>{c}</span>)}</div>}
                          {msg.suggestions && !msg.isStreaming && <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 14 }}>{msg.suggestions.map((s,j) => <button key={j} onClick={() => processQuery(s)} style={{ padding: "6px 14px", borderRadius: 8, border: `0.5px solid ${C.border}`, background: C.bg, color: C.textSec, fontSize: 12, cursor: "pointer", fontFamily: C.sans }} onMouseOver={e => {e.currentTarget.style.borderColor="rgba(222,220,209,0.35)";e.currentTarget.style.color=C.text;}} onMouseOut={e => {e.currentTarget.style.borderColor=C.border;e.currentTarget.style.color=C.textSec;}}>{s}</button>)}</div>}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Composer / Question Overlay */}
            <div style={{ padding: "12px 32px 20px", flexShrink: 0 }}>
              <div style={{ maxWidth: 720, margin: "0 auto" }}>
                {pendingQuestions.length > 0 && currentQIdx < pendingQuestions.length ? (
                  <QuestionOverlay
                    question={pendingQuestions[currentQIdx]}
                    questionIndex={currentQIdx}
                    totalQuestions={pendingQuestions.length}
                    onSelect={handleQuestionAnswer}
                    onSkip={handleQuestionSkip}
                  />
                ) : (
                  <form onSubmit={handleSubmit}>
                    <div style={{ background: C.bgComposer, borderRadius: 20, boxShadow: C.shadow, padding: "4px 4px 4px 18px", display: "flex", alignItems: "center", gap: 8 }}>
                      <input value={input} onChange={e => setInput(e.target.value)} placeholder={isStreaming ? "Quant is thinking..." : "Ask about your data..."}
                        disabled={isStreaming}
                        style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: C.text, fontSize: 14, padding: "10px 0", fontFamily: C.sans, opacity: isStreaming ? 0.5 : 1 }} />
                      {isStreaming ? (
                        <button type="button" onClick={stopStreaming}
                          style={{ width: 36, height: 36, borderRadius: 10, border: "none", background: C.red, color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Square size={14} fill="#fff" />
                        </button>
                      ) : (
                        <button type="submit" disabled={!input.trim()}
                          style={{ width: 36, height: 36, borderRadius: 10, border: "none", background: input.trim() ? C.accent : "transparent", color: input.trim() ? "#fff" : C.textMuted, cursor: input.trim() ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <ArrowUp size={18} />
                        </button>
                      )}
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          {sidebarOpen && data && (
            <div style={{ width: 260, borderLeft: `0.5px solid ${C.border}`, background: C.bgDeep, overflowY: "auto", padding: "16px 14px", flexShrink: 0 }}>
              <Section title="Dataset" icon={<Database size={13} color={C.textMuted}/>} open={expanded.info} toggle={() => setExpanded(p => ({...p, info: !p.info}))}>
                <div style={{ padding: "6px 0", fontSize: 12 }}>
                  <div style={{ color: C.textSec, fontWeight: 500, marginBottom: 4 }}>{dsName}</div>
                  <div style={{ display: "flex", gap: 12, color: C.textMuted, fontSize: 11 }}><span>{data.length} rows</span><span>{allCols.length} cols</span><span>{numCols.length} numeric</span></div>
                </div>
              </Section>
              <Section title="Variables" icon={<BarChart2 size={13} color={C.textMuted}/>} open={expanded.vars} toggle={() => setExpanded(p => ({...p, vars: !p.vars}))}>
                <div style={{ padding: "2px 0" }}>{allCols.map(col => <div key={col} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 12 }}><span style={{ color: C.textSec }}>{col}</span><span style={{ color: C.textMuted, fontSize: 10, padding: "1px 5px", borderRadius: 3, background: "rgba(156,154,146,0.1)", fontFamily: C.mono }}>{numCols.includes(col) ? "num" : "str"}</span></div>)}</div>
              </Section>
              <Section title="Quick Actions" icon={<Zap size={13} color={C.textMuted}/>} open={expanded.actions} toggle={() => setExpanded(p => ({...p, actions: !p.actions}))}>
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {[{ l: "Correlations", q: "Show correlation matrix" }, { l: "Distributions", q: `Distribution of ${numCols[0]}` }, { l: "Trends", q: "Show trends over time" }, { l: "Regression", q: `Predict ${numCols[numCols.length-1]}` }, { l: "Outliers", q: `Detect outliers in ${numCols[0]}` }, { l: "Summary", q: "Compare all variables" }].map((a,i) =>
                    <button key={i} onClick={() => processQuery(a.q)} style={{ padding: "7px 8px", borderRadius: 6, border: "none", background: "transparent", color: C.textMuted, cursor: "pointer", fontSize: 12, textAlign: "left", fontFamily: C.sans }}
                      onMouseOver={e => {e.currentTarget.style.background="rgba(156,154,146,0.08)";e.currentTarget.style.color=C.textSec;}} onMouseOut={e => {e.currentTarget.style.background="transparent";e.currentTarget.style.color=C.textMuted;}}>{a.l}</button>)}
                </div>
              </Section>
            </div>
          )}
        </div>
      )}
      </div>{/* end main content area */}
    </div>
  );
}

function Section({ title, icon, open, toggle, children }) {
  return (
    <div style={{ marginBottom: 4 }}>
      <button onClick={toggle} style={{ display: "flex", alignItems: "center", gap: 7, width: "100%", padding: "8px 6px", borderRadius: 6, border: "none", background: "transparent", color: C.textSec, cursor: "pointer", fontSize: 12, fontWeight: 500, fontFamily: C.sans }}>
        {open ? <ChevronDown size={12} color={C.textMuted}/> : <ChevronRight size={12} color={C.textMuted}/>}{icon} {title}
      </button>
      {open && <div style={{ paddingLeft: 26 }}>{children}</div>}
    </div>
  );
}
