"use client";

import { Database, BarChart2, Zap } from "lucide-react";
import { C } from "../design-system";
import { Section } from "./Section";

export function RightSidebar({ data, dsName, allCols, numCols, expanded, setExpanded, processQuery }) {
  if (!data) return null;

  return (
    <div style={{ width: 260, borderLeft: `0.5px solid ${C.border}`, background: C.bgDeep, overflowY: "auto", padding: "16px 14px", flexShrink: 0 }}>
      <Section title="Dataset" icon={<Database size={13} color={C.textMuted} />} open={expanded.info} toggle={() => setExpanded(p => ({ ...p, info: !p.info }))}>
        <div style={{ padding: "6px 0", fontSize: 12 }}>
          <div style={{ color: C.textSec, fontWeight: 500, marginBottom: 4 }}>{dsName}</div>
          <div style={{ display: "flex", gap: 12, color: C.textMuted, fontSize: 11 }}>
            <span>{data.length} rows</span><span>{allCols.length} cols</span><span>{numCols.length} numeric</span>
          </div>
        </div>
      </Section>
      <Section title="Variables" icon={<BarChart2 size={13} color={C.textMuted} />} open={expanded.vars} toggle={() => setExpanded(p => ({ ...p, vars: !p.vars }))}>
        <div style={{ padding: "2px 0" }}>
          {allCols.map(col => (
            <div key={col} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 12 }}>
              <span style={{ color: C.textSec }}>{col}</span>
              <span style={{ color: C.textMuted, fontSize: 10, padding: "1px 5px", borderRadius: 3, background: C.bgHover, fontFamily: C.mono }}>
                {numCols.includes(col) ? "num" : "str"}
              </span>
            </div>
          ))}
        </div>
      </Section>
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
