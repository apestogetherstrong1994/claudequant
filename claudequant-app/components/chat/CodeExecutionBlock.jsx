"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Play, CheckCircle, AlertCircle, Copy, Check } from "lucide-react";
import { C } from "../design-system";

/**
 * Collapsible code execution block — matches Claude web app's tool-use display.
 *
 * Props:
 *   code     - string of Python/JS code that was executed
 *   language - language label (default: "python")
 *   output   - stdout/stderr text result
 *   status   - "running" | "success" | "error"
 *   images   - array of { url, alt } for generated charts
 */
export function CodeExecutionBlock({ code, language = "python", output, status = "success", images }) {
  const [codeOpen, setCodeOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const statusIcon = {
    running: <span style={{ width: 14, height: 14, border: `2px solid ${C.accent}`, borderTopColor: "transparent", borderRadius: "50%", display: "inline-block", animation: "spin 0.8s linear infinite" }} />,
    success: <CheckCircle size={14} color={C.green} />,
    error: <AlertCircle size={14} color={C.red} />,
  };

  const statusLabel = {
    running: "Running...",
    success: "Executed",
    error: "Error",
  };

  return (
    <div style={{
      margin: "12px 0",
      borderRadius: C.radius,
      border: `0.5px solid ${C.border}`,
      background: C.bgCode,
      overflow: "hidden",
      animation: "fadeIn 0.2s ease",
    }}>
      {/* Header bar */}
      <button
        onClick={() => setCodeOpen(!codeOpen)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "10px 14px",
          background: "transparent",
          border: "none",
          borderBottom: codeOpen ? `0.5px solid ${C.border}` : "none",
          cursor: "pointer",
          color: C.textMuted,
          fontSize: 12,
          fontFamily: C.mono,
          textAlign: "left",
        }}
      >
        {codeOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
        <Play size={11} style={{ color: C.accent, opacity: 0.8 }} />
        <span style={{ color: C.textSec, fontWeight: 500, textTransform: "capitalize" }}>{language}</span>
        <span style={{ flex: 1 }} />
        <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
          {statusIcon[status]}
          <span style={{ color: status === "error" ? C.red : C.textMuted, fontSize: 11 }}>{statusLabel[status]}</span>
        </span>
      </button>

      {/* Collapsible code */}
      {codeOpen && (
        <div style={{ position: "relative" }}>
          <pre style={{
            margin: 0,
            padding: "14px 16px",
            fontSize: 12,
            lineHeight: 1.6,
            fontFamily: C.mono,
            color: C.textSec,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            overflowX: "auto",
            background: C.bgCode,
          }}>
            {code}
          </pre>
          {/* Copy button */}
          <button
            onClick={handleCopy}
            style={{
              position: "absolute",
              top: 8,
              right: 8,
              padding: "4px 8px",
              borderRadius: C.radiusSm,
              border: `0.5px solid ${C.border}`,
              background: C.bgComposer,
              color: copied ? C.green : C.textMuted,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 4,
              fontSize: 11,
              fontFamily: C.sans,
              transition: C.transitionFast,
            }}
            onMouseOver={e => { if (!copied) e.currentTarget.style.color = C.text; }}
            onMouseOut={e => { if (!copied) e.currentTarget.style.color = C.textMuted; }}
          >
            {copied ? <><Check size={11} /> Copied</> : <><Copy size={11} /> Copy</>}
          </button>
        </div>
      )}

      {/* Output */}
      {output && (
        <div style={{
          borderTop: `0.5px solid ${C.border}`,
          padding: "10px 14px",
          background: status === "error" ? "rgba(207,107,99,0.06)" : "rgba(125,186,109,0.04)",
        }}>
          <div style={{
            fontSize: 11,
            fontWeight: 500,
            color: C.textMuted,
            marginBottom: 6,
            fontFamily: C.mono,
            textTransform: "uppercase",
            letterSpacing: 0.5,
          }}>
            {status === "error" ? "Error" : "Output"}
          </div>
          <pre style={{
            margin: 0,
            fontSize: 12,
            lineHeight: 1.5,
            fontFamily: C.mono,
            color: status === "error" ? C.red : C.textSec,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}>
            {output}
          </pre>
        </div>
      )}

      {/* Generated images */}
      {images && images.length > 0 && (
        <div style={{ borderTop: `0.5px solid ${C.border}`, padding: 14 }}>
          {images.map((img, i) => (
            <img
              key={i}
              src={img.url}
              alt={img.alt || `Generated chart ${i + 1}`}
              style={{
                maxWidth: "100%",
                borderRadius: C.radiusSm,
                marginTop: i > 0 ? 8 : 0,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
