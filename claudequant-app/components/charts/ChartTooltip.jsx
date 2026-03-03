"use client";

import { C } from "../design-system";
import { fmt } from "@/lib/stats";

export const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: C.bgComposer, boxShadow: C.shadow, borderRadius: 10, padding: "10px 14px", fontSize: 12, fontFamily: C.sans, border: "none" }}>
      <div style={{ color: C.textMuted, marginBottom: 4, fontSize: 11 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || C.text, lineHeight: 1.6 }}>
          {p.name}: <span style={{ fontFamily: C.mono }}>{fmt(p.value)}</span>
        </div>
      ))}
    </div>
  );
};
