"use client";

import {
  AreaChart, Area, ScatterChart, Scatter, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import { C } from "../design-system";
import { ChartTooltip } from "./ChartTooltip";

export const ChartRenderer = ({ chart }) => {
  const h = 260;
  const ax = { fontSize: 11, fill: C.textMuted, fontFamily: C.sans };
  const gc = "rgba(222,220,209,0.08)";

  if (chart.type === "area") {
    return (
      <ResponsiveContainer width="100%" height={h}>
        <AreaChart data={chart.data} margin={{ top: 10, right: 16, bottom: 4, left: 8 }}>
          <CartesianGrid stroke={gc} strokeDasharray="3 3" />
          <XAxis dataKey={Object.keys(chart.data[0])[0]} tick={ax} interval={Math.floor(chart.data.length / 6)} />
          <YAxis tick={ax} />
          <Tooltip content={<ChartTooltip />} />
          {chart.keys.map((k, i) => (
            <Area key={k} type="monotone" dataKey={k} stroke={C.chart[i % C.chart.length]} fill={C.chart[i % C.chart.length]} fillOpacity={0.06} strokeWidth={2} dot={false} />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    );
  }

  if (chart.type === "scatter") {
    return (
      <ResponsiveContainer width="100%" height={h}>
        <ScatterChart margin={{ top: 10, right: 16, bottom: 4, left: 8 }}>
          <CartesianGrid stroke={gc} strokeDasharray="3 3" />
          <XAxis dataKey={chart.x} name={chart.x} tick={ax} type="number" />
          <YAxis dataKey={chart.y} name={chart.y} tick={ax} type="number" />
          <Tooltip content={<ChartTooltip />} />
          <Scatter data={chart.data} fill={C.accent} fillOpacity={0.75} r={4} />
        </ScatterChart>
      </ResponsiveContainer>
    );
  }

  if (chart.type === "bar") {
    return (
      <ResponsiveContainer width="100%" height={h}>
        <BarChart data={chart.data} margin={{ top: 10, right: 16, bottom: 4, left: 8 }}>
          <CartesianGrid stroke={gc} strokeDasharray="3 3" />
          <XAxis dataKey={chart.x} tick={ax} interval={1} />
          <YAxis tick={ax} />
          <Tooltip content={<ChartTooltip />} />
          <Bar dataKey={chart.y} fill={C.accent} fillOpacity={0.85} radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  if (chart.type === "regression") {
    return (
      <ResponsiveContainer width="100%" height={h}>
        <ScatterChart margin={{ top: 10, right: 16, bottom: 4, left: 8 }}>
          <CartesianGrid stroke={gc} strokeDasharray="3 3" />
          <XAxis dataKey={chart.x} name={chart.x} tick={ax} type="number" />
          <YAxis dataKey={chart.y} name={chart.y} tick={ax} type="number" />
          <Tooltip content={<ChartTooltip />} />
          <Scatter data={chart.data} fill={C.accent} fillOpacity={0.6} r={4} />
          <Scatter data={[...chart.data].sort((a, b) => a[chart.x] - b[chart.x])} dataKey={chart.predicted} fill="none" line={{ stroke: C.blue, strokeWidth: 2 }} r={0} />
        </ScatterChart>
      </ResponsiveContainer>
    );
  }

  if (chart.type === "heatmap") {
    const n = chart.labels.length;
    return (
      <div style={{ overflowX: "auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: `90px repeat(${n}, 1fr)`, gap: 2, fontSize: 11, minWidth: n * 56 + 90 }}>
          <div />
          {chart.labels.map(l => (
            <div key={l} style={{ color: C.textMuted, textAlign: "center", padding: "6px 2px", fontFamily: C.mono, fontSize: 10, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l}</div>
          ))}
          {chart.labels.map((r, i) => [
            <div key={`r-${i}`} style={{ color: C.textMuted, padding: "6px 4px", textAlign: "right", fontFamily: C.mono, fontSize: 10 }}>{r}</div>,
            ...chart.matrix[i].map((v, j) => {
              const abs = Math.abs(v);
              const bg = v > 0 ? `rgba(125,186,109,${abs * 0.5})` : v < 0 ? `rgba(207,107,99,${abs * 0.5})` : "transparent";
              return (
                <div key={`${i}-${j}`} style={{
                  background: bg, color: abs > 0.25 ? C.text : C.textMuted,
                  textAlign: "center", padding: 6, borderRadius: 4,
                  fontFamily: C.mono, fontWeight: i === j ? 600 : 400, fontSize: 11,
                }}>{v.toFixed(2)}</div>
              );
            }),
          ])}
        </div>
      </div>
    );
  }

  return null;
};
