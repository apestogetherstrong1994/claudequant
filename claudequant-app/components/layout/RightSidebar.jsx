"use client";

import { Database, BarChart2, Zap, Target } from "lucide-react";
import { C } from "../design-system";
import { Section } from "./Section";

// ─── Sparkline: tiny inline histogram for numeric variables ──────────────────
function Sparkline({ values, width = 52, height = 16 }) {
  if (!values || values.length < 2) return null;
  const bins = 8;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const bw = range / bins;
  const counts = Array.from({ length: bins }, (_, i) => {
    const lo = min + i * bw;
    const hi = lo + bw;
    return values.filter(v => v >= lo && (i === bins - 1 ? v <= hi : v < hi)).length;
  });
  const maxCount = Math.max(...counts, 1);
  const barW = (width - (bins - 1) * 1) / bins;

  return (
    <svg width={width} height={height} style={{ display: "inline-block", verticalAlign: "middle", opacity: 0.7 }}>
      {counts.map((c, i) => {
        const h = Math.max(1, (c / maxCount) * height);
        return (
          <rect key={i}
            x={i * (barW + 1)} y={height - h}
            width={barW} height={h}
            fill={C.accent} rx={1}
          />
        );
      })}
    </svg>
  );
}

// ─── Data Health Badge ───────────────────────────────────────────────────────
function DataHealthBadge({ data, numCols, allCols }) {
  if (!data || !data.length) return null;

  const n = data.length;
  let totalCells = 0;
  let missingCells = 0;
  allCols.forEach(col => {
    data.forEach(row => {
      totalCells++;
      const val = row[col];
      if (val === null || val === undefined || val === "" || (typeof val === "number" && isNaN(val))) {
        missingCells++;
      }
    });
  });

  const completeness = totalCells > 0 ? ((totalCells - missingCells) / totalCells) * 100 : 100;
  const catCols = allCols.length - numCols.length;

  // Health color based on sample size + completeness
  let healthColor = C.green;
  let healthLabel = "Good";
  if (n < 20 || completeness < 80) { healthColor = C.yellow; healthLabel = "Caution"; }
  if (n < 10 || completeness < 60) { healthColor = C.red; healthLabel = "Limited"; }

  return (
    <div style={{ padding: "8px 0 4px", fontSize: 11 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
        <div style={{ width: 6, height: 6, borderRadius: "50%", background: healthColor, flexShrink: 0 }} />
        <span style={{ color: healthColor, fontWeight: 500, fontSize: 11 }}>{healthLabel}</span>
        <span style={{ color: C.textMuted, fontSize: 10 }}>·</span>
        <span style={{ color: C.textMuted, fontSize: 10 }}>{completeness.toFixed(0)}% complete</span>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
        <span style={{ padding: "2px 6px", borderRadius: 4, background: C.bgHover, fontSize: 10, color: C.textMuted, fontFamily: C.mono }}>n={n}</span>
        <span style={{ padding: "2px 6px", borderRadius: 4, background: C.bgHover, fontSize: 10, color: C.textMuted, fontFamily: C.mono }}>{numCols.length} numeric</span>
        <span style={{ padding: "2px 6px", borderRadius: 4, background: C.bgHover, fontSize: 10, color: C.textMuted, fontFamily: C.mono }}>{catCols} categorical</span>
        {missingCells > 0 && (
          <span style={{ padding: "2px 6px", borderRadius: 4, background: "rgba(207,107,99,0.15)", fontSize: 10, color: C.red, fontFamily: C.mono }}>
            {missingCells} missing
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Hypothesis status cycling ───────────────────────────────────────────────
const H_STATES = [
  { key: "proposed", icon: "○", color: C.textMuted, label: "Proposed" },
  { key: "testing", icon: "◉", color: C.blue, label: "Testing" },
  { key: "supported", icon: "✓", color: C.green, label: "Supported" },
  { key: "refuted", icon: "✗", color: C.red, label: "Refuted" },
];

// ═════════════════════════════════════════════════════════════════════════════
export function RightSidebar({ data, dsName, allCols, numCols, expanded, setExpanded, processQuery, hypotheses = [], onHypothesisStatusChange }) {
  if (!data) return null;

  return (
    <div style={{ width: 260, borderLeft: `0.5px solid ${C.border}`, background: C.bgDeep, overflowY: "auto", padding: "16px 14px", flexShrink: 0 }}>

      {/* Dataset info + Data Health Badge */}
      <Section title="Dataset" icon={<Database size={13} color={C.textMuted} />} open={expanded.info} toggle={() => setExpanded(p => ({ ...p, info: !p.info }))}>
        <div style={{ padding: "6px 0", fontSize: 12 }}>
          <div style={{ color: C.textSec, fontWeight: 500, marginBottom: 4 }}>{dsName}</div>
          <DataHealthBadge data={data} numCols={numCols} allCols={allCols} />
        </div>
      </Section>

      {/* Variables with Sparklines */}
      <Section title="Variables" icon={<BarChart2 size={13} color={C.textMuted} />} open={expanded.vars} toggle={() => setExpanded(p => ({ ...p, vars: !p.vars }))}>
        <div style={{ padding: "2px 0" }}>
          {allCols.map(col => {
            const isNum = numCols.includes(col);
            const vals = isNum ? data.map(r => r[col]).filter(v => v != null && !isNaN(v)) : null;
            return (
              <div key={col} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0", fontSize: 12, gap: 6 }}>
                <span style={{ color: C.textSec, flex: "0 1 auto", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{col}</span>
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                  {isNum && vals && vals.length > 1 && <Sparkline values={vals} />}
                  <span style={{ color: C.textMuted, fontSize: 10, padding: "1px 5px", borderRadius: 3, background: C.bgHover, fontFamily: C.mono }}>
                    {isNum ? "num" : "str"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      {/* Hypothesis Tracker */}
      {hypotheses.length > 0 && (
        <Section
          title="Hypotheses"
          icon={<Target size={13} color={C.textMuted} />}
          open={expanded.hypotheses !== false}
          toggle={() => setExpanded(p => ({ ...p, hypotheses: !(p.hypotheses !== false) }))}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: "4px 0" }}>
            {hypotheses.map((h, i) => {
              const state = H_STATES.find(s => s.key === h.status) || H_STATES[0];
              const nextIdx = (H_STATES.findIndex(s => s.key === h.status) + 1) % H_STATES.length;
              const nextState = H_STATES[nextIdx];
              return (
                <div key={i} style={{
                  padding: "8px 10px", borderRadius: 8,
                  background: C.bgHover, border: `0.5px solid ${C.border}`,
                  fontSize: 11, lineHeight: 1.5, color: C.textSec,
                  animation: "fadeIn 0.3s ease",
                }}>
                  <div style={{ marginBottom: 6 }}>{h.text}</div>
                  <button
                    onClick={() => onHypothesisStatusChange?.(i, nextState.key)}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 4,
                      padding: "2px 8px", borderRadius: 4,
                      border: `0.5px solid ${state.color}30`,
                      background: `${state.color}15`,
                      color: state.color, fontSize: 10, fontWeight: 500,
                      cursor: "pointer", fontFamily: C.sans, transition: C.transitionFast,
                    }}
                    title={`Click to mark as: ${nextState.label}`}
                  >
                    <span style={{ fontSize: 11 }}>{state.icon}</span>
                    {state.label}
                  </button>
                </div>
              );
            })}
          </div>
        </Section>
      )}

      {/* Quick Actions */}
      <Section title="Quick Actions" icon={<Zap size={13} color={C.textMuted} />} open={expanded.actions} toggle={() => setExpanded(p => ({ ...p, actions: !p.actions }))}>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {[
            { l: "Correlations", q: "Show correlation matrix" },
            { l: "Distributions", q: `Distribution of ${numCols[0]}` },
            { l: "Trends", q: "Show trends over time" },
            { l: "Regression", q: `Predict ${numCols[numCols.length - 1]}` },
            { l: "Outliers", q: `Detect outliers in ${numCols[0]}` },
            { l: "Summary", q: "Compare all variables" },
          ].map((a, i) => (
            <button key={i} onClick={() => processQuery(a.q)} style={{ padding: "7px 8px", borderRadius: 6, border: "none", background: "transparent", color: C.textMuted, cursor: "pointer", fontSize: 12, textAlign: "left", fontFamily: C.sans }}
              onMouseOver={e => { e.currentTarget.style.background = C.bgHover; e.currentTarget.style.color = C.textSec; }}
              onMouseOut={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = C.textMuted; }}>
              {a.l}
            </button>
          ))}
        </div>
      </Section>
    </div>
  );
}
