"use client";

import { C } from "../design-system";

/**
 * Subtle skill badge showing which domain skill is active.
 * Matches Claude's tag/badge aesthetic — small, warm, unobtrusive.
 *
 * Props:
 *   skill - { id, name } or null
 */
export function SkillBadge({ skill }) {
  if (!skill) return null;

  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 5,
      padding: "3px 10px",
      borderRadius: C.radiusPill,
      background: C.accentSoft,
      color: C.accent,
      fontSize: 11,
      fontWeight: 500,
      fontFamily: C.sans,
      letterSpacing: 0.2,
      animation: "badgeIn 0.25s ease",
      whiteSpace: "nowrap",
    }}>
      <span style={{
        width: 5,
        height: 5,
        borderRadius: "50%",
        background: C.accent,
        opacity: 0.7,
        flexShrink: 0,
      }} />
      {skill.name}
    </span>
  );
}
