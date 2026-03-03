"use client";

import { C } from "../design-system";

export const StreamingDots = () => (
  <span style={{ display: "inline-flex", gap: 3, marginLeft: 4 }}>
    {[0, 1, 2].map(i => (
      <span key={i} style={{
        width: 4, height: 4, borderRadius: "50%", background: C.accent,
        animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
      }} />
    ))}
  </span>
);
