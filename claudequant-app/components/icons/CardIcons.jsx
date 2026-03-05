"use client";

import { C } from "../design-system";

// A/B split icon — two side-by-side variant cards
export const CardIcon1 = () => (
  <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
    <rect width="36" height="36" rx="8" fill="rgba(222,220,209,0.08)" />
    <rect x="7" y="10" width="9" height="16" rx="2" stroke={C.accent} strokeWidth="1.2" fill="none" />
    <rect x="20" y="10" width="9" height="16" rx="2" stroke={C.textMuted} strokeWidth="1.2" fill="none" />
    <text x="11.5" y="21" textAnchor="middle" fill={C.accent} fontSize="9" fontWeight="600" fontFamily="Inter, sans-serif">A</text>
    <text x="24.5" y="21" textAnchor="middle" fill={C.textMuted} fontSize="9" fontWeight="600" fontFamily="Inter, sans-serif">B</text>
  </svg>
);

// Experimental design — branching treatment/control paths
export const CardIcon2 = () => (
  <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
    <rect width="36" height="36" rx="8" fill="rgba(222,220,209,0.08)" />
    <circle cx="10" cy="18" r="3" stroke={C.textMuted} strokeWidth="1.2" fill="none" />
    <path d="M13 18h3l4-5h5" stroke={C.green} strokeWidth="1.2" strokeLinecap="round" fill="none" />
    <path d="M13 18h3l4 5h5" stroke={C.accent} strokeWidth="1.2" strokeLinecap="round" fill="none" />
    <circle cx="27" cy="13" r="2" fill={C.green} opacity="0.5" />
    <circle cx="27" cy="23" r="2" fill={C.accent} opacity="0.5" />
  </svg>
);

// Magnifying glass over trend line — data exploration
export const CardIcon3 = () => (
  <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
    <rect width="36" height="36" rx="8" fill="rgba(222,220,209,0.08)" />
    <polyline points="7,26 13,20 19,22 25,14 31,10" stroke={C.accent} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <circle cx="21" cy="17" r="5" stroke={C.textMuted} strokeWidth="1.2" fill="none" />
    <line x1="24.5" y1="20.5" x2="28" y2="24" stroke={C.textMuted} strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);
