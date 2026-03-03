"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import { C } from "../design-system";

export function Section({ title, icon, open, toggle, children }) {
  return (
    <div style={{ marginBottom: 4 }}>
      <button onClick={toggle} style={{ display: "flex", alignItems: "center", gap: 7, width: "100%", padding: "8px 6px", borderRadius: 6, border: "none", background: "transparent", color: C.textSec, cursor: "pointer", fontSize: 12, fontWeight: 500, fontFamily: C.sans }}>
        {open ? <ChevronDown size={12} color={C.textMuted} /> : <ChevronRight size={12} color={C.textMuted} />}{icon} {title}
      </button>
      {open && <div style={{ paddingLeft: 26 }}>{children}</div>}
    </div>
  );
}
