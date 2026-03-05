"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { C } from "../design-system";

// ─── Copy button for code blocks ─────────────────────────────────────────────
function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };
  return (
    <button
      onClick={handleCopy}
      style={{
        position: "absolute", top: 8, right: 8,
        padding: "3px 8px", borderRadius: C.radiusSm,
        border: `0.5px solid ${C.border}`,
        background: C.bgComposer, color: copied ? C.green : C.textMuted,
        cursor: "pointer", display: "flex", alignItems: "center", gap: 4,
        fontSize: 11, fontFamily: C.sans, transition: C.transitionFast,
        opacity: 0, pointerEvents: "auto",
      }}
      className="code-copy-btn"
      onMouseOver={e => { if (!copied) e.currentTarget.style.color = C.text; }}
      onMouseOut={e => { if (!copied) e.currentTarget.style.color = C.textMuted; }}
    >
      {copied ? <><Check size={11} /> Copied</> : <><Copy size={11} /> Copy</>}
    </button>
  );
}

// ─── Inline markdown parser ─────────────────────────────────────────────────
export const renderInline = (text, keyPrefix = "") => {
  if (!text) return null;
  const parts = [];
  const regex = /(\*\*\*[^*]+\*\*\*|\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
  let lastIdx = 0;
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIdx) parts.push({ type: "text", content: text.slice(lastIdx, match.index) });
    const m = match[1];
    if (m.startsWith("***") && m.endsWith("***")) parts.push({ type: "bolditalic", content: m.slice(3, -3) });
    else if (m.startsWith("**") && m.endsWith("**")) parts.push({ type: "bold", content: m.slice(2, -2) });
    else if (m.startsWith("*") && m.endsWith("*")) parts.push({ type: "italic", content: m.slice(1, -1) });
    else if (m.startsWith("`") && m.endsWith("`")) parts.push({ type: "code", content: m.slice(1, -1) });
    lastIdx = regex.lastIndex;
  }
  if (lastIdx < text.length) parts.push({ type: "text", content: text.slice(lastIdx) });
  return parts.map((p, i) => {
    const k = `${keyPrefix}-${i}`;
    if (p.type === "bold") return <strong key={k} style={{ color: C.text, fontWeight: 600 }}>{p.content}</strong>;
    if (p.type === "italic") return <em key={k} style={{ fontStyle: "italic" }}>{p.content}</em>;
    if (p.type === "bolditalic") return <strong key={k} style={{ color: C.text, fontWeight: 600, fontStyle: "italic" }}>{p.content}</strong>;
    if (p.type === "code") return (
      <code key={k} style={{
        background: "rgba(255,255,255,0.06)", padding: "1px 6px",
        borderRadius: 5, fontSize: "0.88em", fontFamily: C.mono, color: C.accent,
        border: `0.5px solid ${C.border}`,
      }}>{p.content}</code>
    );
    return <span key={k}>{p.content}</span>;
  });
};

// ─── Block-level markdown renderer ──────────────────────────────────────────
export const renderMarkdown = (text) => {
  if (!text) return null;
  // Strip any hallucinated <tool_call> blocks that Claude may output as text
  const cleaned = text.replace(/<tool_call>[\s\S]*?<\/tool_call>/g, "").trim();
  if (!cleaned) return null;
  const lines = cleaned.split("\n");
  const elements = [];
  let i = 0;
  let elKey = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Code block
    if (line.trimStart().startsWith("```")) {
      const langMatch = line.trimStart().match(/^```(\w+)?/);
      const lang = langMatch?.[1] || "";
      const codeLines = [];
      i++;
      while (i < lines.length && !lines[i].trimStart().startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      if (i < lines.length) i++;
      const codeText = codeLines.join("\n");
      elements.push(
        <div key={elKey++} style={{
          margin: "14px 0", position: "relative",
          borderRadius: C.radius, overflow: "hidden",
          border: `0.5px solid ${C.border}`,
          background: C.bgCode,
        }}
        onMouseOver={e => { const btn = e.currentTarget.querySelector('.code-copy-btn'); if (btn) btn.style.opacity = '1'; }}
        onMouseOut={e => { const btn = e.currentTarget.querySelector('.code-copy-btn'); if (btn) btn.style.opacity = '0'; }}
        >
          {/* Language label */}
          {lang && (
            <div style={{
              padding: "6px 14px",
              borderBottom: `0.5px solid ${C.border}`,
              fontSize: 11, fontFamily: C.mono, fontWeight: 500,
              color: C.textMuted, textTransform: "capitalize",
              background: "rgba(255,255,255,0.02)",
            }}>
              {lang}
            </div>
          )}
          <div style={{ position: "relative" }}>
            <pre style={{
              margin: 0, padding: "14px 16px",
              fontSize: 12.5, lineHeight: 1.65, fontFamily: C.mono,
              color: C.textSec, whiteSpace: "pre-wrap", wordBreak: "break-word",
              overflowX: "auto",
            }}>
              {codeText}
            </pre>
            <CopyButton text={codeText} />
          </div>
        </div>
      );
      continue;
    }

    // Insight card
    const insightMatch = line.match(/^\[INSIGHT_DISPLAY\](.*)\[\/INSIGHT_DISPLAY\]$/);
    if (insightMatch) {
      elements.push(
        <div key={elKey++} style={{
          margin: "16px 0", padding: "14px 16px",
          borderRadius: C.radius,
          background: C.accentSoft,
          borderLeft: `3px solid ${C.accent}`,
          display: "flex", gap: 10, alignItems: "flex-start",
        }}>
          <span style={{ fontSize: 15, flexShrink: 0, marginTop: 1 }}>🔍</span>
          <div style={{ flex: 1, fontSize: 14, lineHeight: 1.65, color: C.text, fontFamily: C.sans, fontWeight: 500 }}>
            {renderInline(insightMatch[1].trim(), `insight-${elKey}`)}
          </div>
        </div>
      );
      i++;
      continue;
    }

    // Heading
    const headingMatch = line.match(/^(#{1,4})\s+(.+)/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const content = headingMatch[2];
      const sizes = { 1: 20, 2: 17, 3: 15, 4: 14 };
      elements.push(
        <div key={elKey++} style={{
          fontSize: sizes[level] || 14, fontWeight: 600, color: C.text,
          marginTop: level <= 2 ? 22 : 16, marginBottom: 8,
          fontFamily: C.sans, letterSpacing: -0.3,
          paddingBottom: level <= 2 ? 6 : 0,
          borderBottom: level <= 2 ? `0.5px solid ${C.border}` : "none",
        }}>
          {renderInline(content, `h-${elKey}`)}
        </div>
      );
      i++;
      continue;
    }

    // Horizontal rule
    if (line.match(/^\s*[-*_]{3,}\s*$/)) {
      elements.push(<hr key={elKey++} style={{ border: "none", borderTop: `0.5px solid ${C.border}`, margin: "18px 0" }} />);
      i++;
      continue;
    }

    // Markdown table
    if (line.includes("|") && i + 1 < lines.length && lines[i + 1]?.match(/^\|?\s*[-:]+[-|:\s]*/)) {
      const tableLines = [];
      while (i < lines.length && lines[i].includes("|")) {
        tableLines.push(lines[i]);
        i++;
      }
      if (tableLines.length >= 2) {
        const parseRow = (row) => row.split("|").map(s => s.trim()).filter((s, idx, arr) => idx > 0 || s !== "").filter((s, idx, arr) => idx < arr.length - (arr[arr.length - 1] === "" ? 1 : 0));
        const headers = parseRow(tableLines[0]);
        const alignLine = tableLines[1];
        const aligns = parseRow(alignLine).map(c => {
          if (c.startsWith(":") && c.endsWith(":")) return "center";
          if (c.endsWith(":")) return "right";
          return "left";
        });
        const rows = tableLines.slice(2).map(parseRow);
        elements.push(
          <div key={elKey++} style={{
            overflowX: "auto", margin: "14px 0",
            borderRadius: C.radius, border: `0.5px solid ${C.border}`,
            background: C.bgComposer,
          }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, fontFamily: C.sans }}>
              <thead>
                <tr>
                  {headers.map((h, hi) => (
                    <th key={hi} style={{
                      padding: "10px 14px", textAlign: aligns[hi] || "left",
                      color: C.textMuted, fontWeight: 600, fontSize: 11,
                      textTransform: "uppercase", letterSpacing: 0.5,
                      borderBottom: `1px solid ${C.border}`,
                      background: "rgba(0,0,0,0.12)",
                    }}>{renderInline(h, `th-${hi}`)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, ri) => (
                  <tr key={ri} style={{ background: ri % 2 === 1 ? "rgba(0,0,0,0.04)" : "transparent" }}>
                    {row.map((cell, ci) => (
                      <td key={ci} style={{
                        padding: "8px 14px",
                        textAlign: aligns[ci] || "left",
                        color: ci === 0 ? C.text : C.textSec,
                        fontFamily: ci > 0 && cell.match(/^[\d.$%,+-]+$/) ? C.mono : C.sans,
                        fontSize: 13, fontWeight: ci === 0 ? 500 : 400,
                        borderBottom: ri < rows.length - 1 ? `0.5px solid rgba(255,255,255,0.04)` : "none",
                      }}>{renderInline(cell, `td-${ri}-${ci}`)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }
      continue;
    }

    // Bullet list
    if (line.match(/^\s*[-*]\s/)) {
      const items = [];
      while (i < lines.length && lines[i].match(/^\s*[-*]\s/)) {
        items.push(lines[i].replace(/^\s*[-*]\s+/, ""));
        i++;
      }
      elements.push(
        <div key={elKey++} style={{ margin: "8px 0", paddingLeft: 4 }}>
          {items.map((item, ii) => (
            <div key={ii} style={{ display: "flex", gap: 10, marginBottom: 5, lineHeight: 1.65 }}>
              <div style={{ width: 4, height: 4, borderRadius: "50%", background: C.accent, flexShrink: 0, marginTop: 9, opacity: 0.5 }} />
              <div style={{ flex: 1, color: C.textSec, fontSize: 14, fontFamily: C.sans }}>{renderInline(item, `li-${ii}`)}</div>
            </div>
          ))}
        </div>
      );
      continue;
    }

    // Numbered list
    if (line.match(/^\s*\d+[.)]\s/)) {
      const items = [];
      while (i < lines.length && lines[i].match(/^\s*\d+[.)]\s/)) {
        items.push(lines[i].replace(/^\s*\d+[.)]\s+/, ""));
        i++;
      }
      elements.push(
        <div key={elKey++} style={{ margin: "8px 0", paddingLeft: 4 }}>
          {items.map((item, ii) => (
            <div key={ii} style={{ display: "flex", gap: 10, marginBottom: 5, lineHeight: 1.65 }}>
              <span style={{ color: C.accent, fontSize: 13, fontWeight: 600, fontFamily: C.mono, minWidth: 18, flexShrink: 0, opacity: 0.6 }}>{ii + 1}.</span>
              <div style={{ flex: 1, color: C.textSec, fontSize: 14, fontFamily: C.sans }}>{renderInline(item, `ni-${ii}`)}</div>
            </div>
          ))}
        </div>
      );
      continue;
    }

    // Blockquote
    if (line.match(/^\s*>\s?/)) {
      const quoteLines = [];
      while (i < lines.length && lines[i].match(/^\s*>\s?/)) {
        quoteLines.push(lines[i].replace(/^\s*>\s?/, ""));
        i++;
      }
      elements.push(
        <div key={elKey++} style={{
          borderLeft: `3px solid ${C.accent}`, paddingLeft: 14, margin: "12px 0",
          color: C.textMuted, fontSize: 14, fontStyle: "italic", lineHeight: 1.65,
          fontFamily: C.serif,
        }}>
          {renderInline(quoteLines.join(" "), `bq-${elKey}`)}
        </div>
      );
      continue;
    }

    // Empty line
    if (line.trim() === "") { i++; continue; }

    // Regular paragraph
    const paraLines = [];
    while (i < lines.length && lines[i].trim() !== "" &&
      !lines[i].match(/^#{1,4}\s/) && !lines[i].match(/^\s*[-*]\s/) &&
      !lines[i].match(/^\s*\d+[.)]\s/) && !lines[i].match(/^\s*>\s?/) &&
      !lines[i].trimStart().startsWith("```") && !lines[i].match(/^\s*[-*_]{3,}\s*$/) &&
      !(lines[i].includes("|") && i + 1 < lines.length && lines[i + 1]?.match(/^\|?\s*[-:]+[-|:\s]*/))
    ) {
      paraLines.push(lines[i]);
      i++;
    }
    if (paraLines.length > 0) {
      elements.push(
        <p key={elKey++} style={{ margin: "6px 0", fontSize: 14, lineHeight: 1.7, color: C.textSec, fontFamily: C.sans }}>
          {renderInline(paraLines.join(" "), `p-${elKey}`)}
        </p>
      );
    }
  }
  return elements;
};
