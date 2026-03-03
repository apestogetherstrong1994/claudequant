"use client";

import { useEffect, useCallback } from "react";
import { X } from "lucide-react";
import { C } from "../design-system";
import { ChartRenderer } from "./ChartRenderer";
import { exportChartAsPNG } from "../export/ExportUtils";

/**
 * Full-screen modal for zoomed chart view.
 * Matches Claude's modal overlay aesthetic.
 *
 * Props:
 *   chart   - chart config object { type, data, keys, ... }
 *   onClose - callback to dismiss
 */
export function ChartZoomModal({ chart, onClose }) {
  // Close on Escape
  const handleKeyDown = useCallback((e) => {
    if (e.key === "Escape") onClose();
  }, [onClose]);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [handleKeyDown]);

  if (!chart) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: C.bgOverlay,
        backdropFilter: "blur(4px)",
        animation: "overlayIn 0.15s ease",
        padding: 40,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 960,
          background: C.bgComposer,
          borderRadius: C.radiusLg,
          border: `0.5px solid ${C.border}`,
          boxShadow: C.shadowModal,
          animation: "modalIn 0.2s ease",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 16px",
          borderBottom: `0.5px solid ${C.border}`,
        }}>
          <span style={{
            fontSize: 13,
            fontWeight: 500,
            color: C.textSec,
            fontFamily: C.sans,
          }}>
            Chart View
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              onClick={onClose}
              style={{
                width: 28,
                height: 28,
                borderRadius: C.radiusSm,
                border: "none",
                background: "transparent",
                color: C.textMuted,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: C.transitionFast,
              }}
              onMouseOver={e => { e.currentTarget.style.background = C.bgHover; e.currentTarget.style.color = C.text; }}
              onMouseOut={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = C.textMuted; }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Chart body */}
        <div id="chart-zoom-container" style={{ padding: "24px 16px 16px 0", minHeight: 400 }}>
          <ChartRenderer chart={chart} width={920} height={420} />
        </div>
      </div>
    </div>
  );
}
