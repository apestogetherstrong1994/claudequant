"use client";

import { useState, useRef, useEffect } from "react";
import { Download } from "lucide-react";
import { C } from "../design-system";
import { exportAsMarkdown, exportAsJSON } from "./ExportUtils";

export function ExportMenu({ messages, data, dsName }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  if (!messages || messages.length === 0) return null;

  return (
    <div ref={menuRef} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          padding: "5px 12px", borderRadius: C.radiusSm, border: `0.5px solid ${C.border}`,
          background: "transparent", color: C.textSec, cursor: "pointer",
          fontSize: 13, display: "flex", alignItems: "center", gap: 6,
          fontFamily: C.sans, transition: C.transitionFast,
        }}
        onMouseOver={e => { e.currentTarget.style.background = C.bgHover; e.currentTarget.style.borderColor = C.borderHover; }}
        onMouseOut={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = C.border; }}
      >
        <Download size={13} /> Export
      </button>

      {open && (
        <div style={{
          position: "absolute", top: "100%", right: 0, marginTop: 4,
          background: C.bgComposer, borderRadius: C.radius, border: `0.5px solid ${C.border}`,
          boxShadow: C.shadowModal, padding: 4, minWidth: 180, zIndex: 100,
          animation: "fadeIn 0.12s ease",
        }}>
          {[
            { label: "Markdown (.md)", action: () => exportAsMarkdown(messages, dsName) },
            { label: "JSON (.json)", action: () => exportAsJSON(messages, data, dsName) },
          ].map((item, i) => (
            <button key={i}
              onClick={() => { item.action(); setOpen(false); }}
              style={{
                display: "block", width: "100%", padding: "8px 12px", borderRadius: C.radiusSm,
                border: "none", background: "transparent", color: C.textSec,
                cursor: "pointer", fontSize: 13, textAlign: "left", fontFamily: C.sans,
                transition: C.transitionFast,
              }}
              onMouseOver={e => { e.currentTarget.style.background = C.bgHover; e.currentTarget.style.color = C.text; }}
              onMouseOut={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = C.textSec; }}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
