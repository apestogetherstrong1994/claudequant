"use client";

import { useRef, useCallback } from "react";
import { Plus, ArrowUp, Square, X, Image, File } from "lucide-react";
import { C } from "../design-system";

const ATTACH_ACCEPT = ".jpg,.jpeg,.png,.gif,.webp,.pdf,.txt,.csv,.md,.json,.py,.js,.ts,.html,.css";
const MIME_MAP = {
  jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", gif: "image/gif", webp: "image/webp",
  pdf: "application/pdf", txt: "text/plain", csv: "text/plain", md: "text/plain",
  json: "text/plain", py: "text/plain", js: "text/plain", ts: "text/plain",
  html: "text/plain", css: "text/plain",
};
const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/gif", "image/webp"]);

export function Composer({ input, setInput, isStreaming, onSubmit, onStop, attachedFiles, setAttachedFiles }) {
  const attachRef = useRef(null);

  const handleAttachFiles = useCallback((e) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      const ext = file.name.split(".").pop().toLowerCase();
      const mediaType = MIME_MAP[ext] || "text/plain";
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result.split(",")[1];
        setAttachedFiles(prev => [...prev, {
          name: file.name,
          mediaType,
          data: base64,
          isImage: IMAGE_TYPES.has(mediaType),
          size: file.size,
        }]);
      };
      reader.readAsDataURL(file);
    });
    if (attachRef.current) attachRef.current.value = "";
  }, [setAttachedFiles]);

  const removeAttachment = useCallback((idx) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== idx));
  }, [setAttachedFiles]);

  const handleSubmit = (e) => {
    e?.preventDefault();
    if ((input.trim() || attachedFiles.length > 0) && !isStreaming) {
      onSubmit(input.trim() || "Please analyze the attached file(s).");
      setInput("");
    }
  };

  const hasContent = input.trim() || attachedFiles.length > 0;

  return (
    <form onSubmit={handleSubmit}>
      <input ref={attachRef} type="file" accept={ATTACH_ACCEPT} onChange={handleAttachFiles} multiple style={{ display: "none" }} />
      <div style={{ background: C.bgComposer, borderRadius: 22, boxShadow: C.shadow, padding: 4, border: `0.5px solid ${C.border}` }}>
        {/* Attached file chips */}
        {attachedFiles.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, padding: "8px 14px 4px" }}>
            {attachedFiles.map((f, fi) => (
              <div key={fi} style={{
                display: "flex", alignItems: "center", gap: 6, padding: "4px 8px 4px 10px",
                borderRadius: C.radiusSm, background: "rgba(255,255,255,0.04)", border: `0.5px solid ${C.border}`,
                fontSize: 12, color: C.textSec, fontFamily: C.sans,
              }}>
                {f.isImage ? <Image size={12} color={C.accent} /> : <File size={12} color={C.textMuted} />}
                <span style={{ maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</span>
                <button type="button" onClick={() => removeAttachment(fi)}
                  style={{ background: "transparent", border: "none", cursor: "pointer", padding: 0, display: "flex", color: C.textMuted, transition: C.transitionFast }}
                  onMouseOver={e => e.currentTarget.style.color = C.text}
                  onMouseOut={e => e.currentTarget.style.color = C.textMuted}>
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
        {/* Input row */}
        <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "0 0 0 4px" }}>
          <button type="button" onClick={() => attachRef.current?.click()}
            disabled={isStreaming}
            style={{
              width: 32, height: 32, borderRadius: C.radiusSm, border: "none",
              background: "transparent", color: C.textMuted, cursor: isStreaming ? "default" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              opacity: isStreaming ? 0.3 : 1, flexShrink: 0, transition: C.transitionFast,
            }}
            onMouseOver={e => { if (!isStreaming) e.currentTarget.style.background = C.bgHover; }}
            onMouseOut={e => { e.currentTarget.style.background = "transparent"; }}>
            <Plus size={18} />
          </button>
          <input value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(e); } }}
            placeholder={isStreaming ? "Quant is thinking..." : "Ask about your data..."}
            disabled={isStreaming}
            style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: C.text, fontSize: 14, padding: "10px 0", fontFamily: C.sans, opacity: isStreaming ? 0.5 : 1 }} />
          {isStreaming ? (
            <button type="button" onClick={onStop}
              style={{ width: 36, height: 36, borderRadius: C.radius, border: "none", background: C.red, color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: C.transitionFast }}>
              <Square size={14} fill="#fff" />
            </button>
          ) : (
            <button type="submit" disabled={!hasContent}
              style={{
                width: 36, height: 36, borderRadius: C.radius, border: "none",
                background: hasContent ? C.accent : "transparent",
                color: hasContent ? "#fff" : C.textMuted,
                cursor: hasContent ? "pointer" : "default",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: C.transitionFast,
              }}>
              <ArrowUp size={18} />
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
