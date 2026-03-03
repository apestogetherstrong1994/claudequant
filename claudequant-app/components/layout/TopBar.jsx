"use client";

import { PanelLeft } from "lucide-react";
import { C } from "../design-system";

export function TopBar({ navOpen, setNavOpen }) {
  return (
    <div style={{ position: "relative", zIndex: 2, display: "flex", alignItems: "center", padding: "12px 16px 0" }}>
      {!navOpen && (
        <button onClick={() => setNavOpen(true)} style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, borderRadius: 6, border: "none", background: "transparent", color: C.textMuted, cursor: "pointer", marginRight: 8 }}
          onMouseOver={e => e.currentTarget.style.background = C.bgHover} onMouseOut={e => e.currentTarget.style.background = "transparent"}>
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
  );
}
