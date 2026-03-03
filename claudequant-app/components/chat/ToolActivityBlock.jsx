"use client";

import { useState } from "react";
import { Code, Globe, Search, ChevronDown, ChevronRight, Check, X, Loader } from "lucide-react";
import { C } from "../design-system";

const TOOL_META = {
  code_execution: { icon: Code, label: "Running code", color: C.accent },
  bash_code_execution: { icon: Code, label: "Running code", color: C.accent },
  web_fetch: { icon: Globe, label: "Fetching data", color: "#6BA3D6" },
  web_search: { icon: Search, label: "Searching the web", color: "#A58FD8" },
};

function StatusIcon({ status }) {
  if (status === "running") return <Loader size={12} style={{ animation: "spin 1s linear infinite", color: C.textMuted }} />;
  if (status === "success") return <Check size={12} style={{ color: C.green }} />;
  if (status === "error") return <X size={12} style={{ color: C.red }} />;
  return null;
}

function ActivityItem({ activity }) {
  const [expanded, setExpanded] = useState(false);
  const meta = TOOL_META[activity.type] || TOOL_META.code_execution;
  const Icon = meta.icon;

  const hasDetails = activity.stdout || activity.stderr || activity.input?.command || activity.input?.code || activity.url || activity.results;

  return (
    <div style={{
      border: `0.5px solid ${C.border}`,
      borderRadius: C.radius,
      background: C.bgCode,
      overflow: "hidden",
      marginBottom: 6,
    }}>
      {/* Header */}
      <button
        onClick={() => hasDetails && setExpanded(!expanded)}
        style={{
          display: "flex", alignItems: "center", gap: 8,
          width: "100%", padding: "8px 12px",
          background: "transparent", border: "none",
          cursor: hasDetails ? "pointer" : "default",
          fontFamily: C.sans, fontSize: 12, color: C.textSec,
          textAlign: "left",
        }}
      >
        {hasDetails ? (
          expanded ?
            <ChevronDown size={12} style={{ color: C.textMuted, flexShrink: 0 }} /> :
            <ChevronRight size={12} style={{ color: C.textMuted, flexShrink: 0 }} />
        ) : (
          <span style={{ width: 12, flexShrink: 0 }} />
        )}
        <Icon size={13} style={{ color: meta.color, flexShrink: 0 }} />
        <span style={{ flex: 1, color: C.textSec, fontWeight: 500 }}>
          {activity.status === "running" ? meta.label : meta.label.replace(/ing\b/, "ed").replace("Running", "Ran").replace("Searching", "Searched").replace("Fetching", "Fetched")}
          {activity.type === "web_fetch" && activity.url && (
            <span style={{ fontWeight: 400, color: C.textMuted, marginLeft: 6 }}>
              {activity.url.length > 60 ? activity.url.slice(0, 60) + "…" : activity.url}
            </span>
          )}
          {activity.type === "web_search" && activity.input?.query && (
            <span style={{ fontWeight: 400, color: C.textMuted, marginLeft: 6 }}>
              "{activity.input.query}"
            </span>
          )}
        </span>
        <StatusIcon status={activity.status} />
      </button>

      {/* Expandable details */}
      {expanded && hasDetails && (
        <div style={{
          borderTop: `0.5px solid ${C.border}`,
          padding: "8px 12px",
          maxHeight: 300,
          overflowY: "auto",
        }}>
          {/* Code input */}
          {activity.input?.command && (
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 10, color: C.textMuted, marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>Command</div>
              <pre style={{
                margin: 0, padding: "8px 10px",
                background: C.bgDeep, borderRadius: C.radiusSm,
                fontSize: 11.5, fontFamily: C.mono, color: C.textSec,
                whiteSpace: "pre-wrap", wordBreak: "break-word",
                border: `0.5px solid ${C.border}`,
              }}>
                {activity.input.command}
              </pre>
            </div>
          )}

          {/* Stdout */}
          {activity.stdout && (
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 10, color: C.textMuted, marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>Output</div>
              <pre style={{
                margin: 0, padding: "8px 10px",
                background: C.bgDeep, borderRadius: C.radiusSm,
                fontSize: 11, fontFamily: C.mono, color: C.green,
                whiteSpace: "pre-wrap", wordBreak: "break-word",
                maxHeight: 200, overflowY: "auto",
                border: `0.5px solid ${C.border}`,
              }}>
                {activity.stdout.length > 2000 ? activity.stdout.slice(0, 2000) + "\n... (truncated)" : activity.stdout}
              </pre>
            </div>
          )}

          {/* Stderr */}
          {activity.stderr && (
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 10, color: C.red, marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>Error</div>
              <pre style={{
                margin: 0, padding: "8px 10px",
                background: "rgba(200,50,50,0.08)", borderRadius: C.radiusSm,
                fontSize: 11, fontFamily: C.mono, color: C.red,
                whiteSpace: "pre-wrap", wordBreak: "break-word",
                border: `0.5px solid rgba(200,50,50,0.2)`,
              }}>
                {activity.stderr.length > 1000 ? activity.stderr.slice(0, 1000) + "\n... (truncated)" : activity.stderr}
              </pre>
            </div>
          )}

          {/* Web search results */}
          {activity.results && activity.results.length > 0 && (
            <div>
              <div style={{ fontSize: 10, color: C.textMuted, marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>Results</div>
              {activity.results.map((r, i) => (
                <div key={i} style={{ marginBottom: 4, fontSize: 11, lineHeight: 1.4 }}>
                  <span style={{ color: C.textSec }}>{r.title}</span>
                  {r.url && <span style={{ color: C.textMuted, marginLeft: 6, fontSize: 10 }}>{r.url.slice(0, 50)}…</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function ToolActivityBlock({ activities }) {
  if (!activities || activities.length === 0) return null;

  return (
    <div style={{ marginTop: 10, marginBottom: 10, animation: "fadeIn 0.2s ease" }}>
      {activities.map((activity, i) => (
        <ActivityItem key={activity.toolId || i} activity={activity} />
      ))}
    </div>
  );
}
