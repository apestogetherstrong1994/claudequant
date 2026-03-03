"use client";

import { PanelLeft, ArrowRight, Plus, Search, MoreHorizontal } from "lucide-react";
import { C } from "../design-system";

export function LeftSidebar({ navOpen, setNavOpen, sessions, activeSession, setActiveSession }) {
  if (!navOpen) return null;

  return (
    <div style={{ width: 220, flexShrink: 0, background: C.bgDeep, display: "flex", flexDirection: "column", borderRight: `0.5px solid ${C.border}`, zIndex: 10 }}>
      {/* Top controls */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 12px 8px" }}>
        <button onClick={() => setNavOpen(false)} style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, borderRadius: 6, border: "none", background: "transparent", color: C.textMuted, cursor: "pointer" }}
          onMouseOver={e => e.currentTarget.style.background = C.bgHover} onMouseOut={e => e.currentTarget.style.background = "transparent"}>
          <PanelLeft size={16} />
        </button>
        <div style={{ display: "flex", gap: 4 }}>
          <button style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, borderRadius: 6, border: "none", background: "transparent", color: C.textMuted, cursor: "pointer", fontSize: 13 }}
            onMouseOver={e => e.currentTarget.style.background = C.bgHover} onMouseOut={e => e.currentTarget.style.background = "transparent"}>
            <ArrowRight size={14} style={{ transform: "rotate(180deg)" }} />
          </button>
          <button style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, borderRadius: 6, border: "none", background: "transparent", color: C.textMuted, cursor: "pointer" }}
            onMouseOver={e => e.currentTarget.style.background = C.bgHover} onMouseOut={e => e.currentTarget.style.background = "transparent"}>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* New task + Search */}
      <div style={{ padding: "4px 8px" }}>
        <button style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "7px 8px", borderRadius: 6, border: "none", background: "transparent", color: C.text, cursor: "pointer", fontSize: 13, fontFamily: C.sans, fontWeight: 400 }}
          onMouseOver={e => e.currentTarget.style.background = C.bgHover} onMouseOut={e => e.currentTarget.style.background = "transparent"}>
          <Plus size={14} color={C.textMuted} /> New task
        </button>
        <button style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "7px 8px", borderRadius: 6, border: "none", background: "transparent", color: C.textSec, cursor: "pointer", fontSize: 13, fontFamily: C.sans }}
          onMouseOver={e => e.currentTarget.style.background = C.bgHover} onMouseOut={e => e.currentTarget.style.background = "transparent"}>
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
              background: activeSession === s.id ? C.bgHover : "transparent",
              color: activeSession === s.id ? C.text : C.textSec,
            }}
            onMouseOver={e => { if (activeSession !== s.id) e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}
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
          onMouseOver={e => e.currentTarget.style.background = C.bgHover} onMouseOut={e => e.currentTarget.style.background = "transparent"}>
          Plugins
        </button>
        {/* User profile */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 8px 4px" }}>
          <div style={{ width: 24, height: 24, borderRadius: 6, background: C.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 600, color: "#fff" }}>D</div>
          <span style={{ fontSize: 13, color: C.text }}>Dev</span>
        </div>
      </div>
    </div>
  );
}
