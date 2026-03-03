"use client";

import { C } from "../design-system";

export const CardIcon1 = () => (
  <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
    <rect width="36" height="36" rx="8" fill="rgba(222,220,209,0.08)" />
    <path d="M10 24V14l8-4 8 4v10l-8 4-8-4z" stroke={C.textMuted} strokeWidth="1.2" fill="none" />
    <path d="M18 14v10M10 14l8 4 8-4" stroke={C.textMuted} strokeWidth="1.2" />
  </svg>
);

export const CardIcon2 = () => (
  <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
    <rect width="36" height="36" rx="8" fill="rgba(222,220,209,0.08)" />
    <rect x="10" y="12" width="16" height="12" rx="2" stroke={C.textMuted} strokeWidth="1.2" fill="none" />
    <path d="M14 16h8M14 19h5" stroke={C.textMuted} strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);

export const CardIcon3 = () => (
  <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
    <rect width="36" height="36" rx="8" fill="rgba(222,220,209,0.08)" />
    <circle cx="15" cy="16" r="3" stroke={C.textMuted} strokeWidth="1.2" fill="none" />
    <path d="M21 13l-3 3M21 19l-3-3M15 22v-3M15 13v-2" stroke={C.textMuted} strokeWidth="1.2" strokeLinecap="round" />
    <path d="M10 25h16" stroke={C.textMuted} strokeWidth="1.2" strokeLinecap="round" strokeDasharray="2 2" />
  </svg>
);

export const CardIcon4 = () => (
  <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
    <rect width="36" height="36" rx="8" fill="rgba(222,220,209,0.08)" />
    <circle cx="16" cy="16" r="4" stroke={C.textMuted} strokeWidth="1.2" fill="none" />
    <path d="M16 10v-1M16 23v-1M10 16H9M23 16h-1M11.8 11.8l-.7-.7M20.9 20.9l-.7-.7M20.9 11.8l.7-.7M11.8 20.9l-.7-.7" stroke={C.textMuted} strokeWidth="1.2" strokeLinecap="round" />
    <path d="M20 22c1.5-1 3-1 4 0s1.5 2 3 2" stroke={C.textMuted} strokeWidth="1.2" strokeLinecap="round" fill="none" />
  </svg>
);
