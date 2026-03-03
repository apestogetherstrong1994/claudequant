"use client";

import { useRef, useEffect } from "react";
import { Upload, ArrowRight, ChevronDown } from "lucide-react";
import { C } from "../design-system";
import { ClaudeLogo } from "../icons/ClaudeLogo";
import { CardIcon1, CardIcon2, CardIcon3, CardIcon4 } from "../icons/CardIcons";
import { PROMPTS } from "@/lib/prompts";

export function WelcomeScreen({ welcomeInput, setWelcomeInput, onSubmit, onUploadCSV, onTaskCard }) {
  const welcomeRef = useRef(null);
  const cardsRef = useRef(null);

  // Auto-resize textarea when prompt is populated
  useEffect(() => {
    if (welcomeRef.current) {
      welcomeRef.current.style.height = "auto";
      let maxH = 240;
      if (cardsRef.current) {
        const cardsBottom = cardsRef.current.getBoundingClientRect().bottom;
        const viewportH = window.innerHeight;
        maxH = Math.max(120, viewportH - cardsBottom - 48 - 80);
      }
      const naturalH = welcomeRef.current.scrollHeight;
      if (naturalH <= maxH) {
        welcomeRef.current.style.height = naturalH + "px";
        welcomeRef.current.style.overflow = "hidden";
      } else {
        welcomeRef.current.style.height = maxH + "px";
        welcomeRef.current.style.overflow = "auto";
      }
    }
  }, [welcomeInput]);

  const handleTaskCard = (promptKey) => {
    setWelcomeInput(PROMPTS[promptKey] || "");
    setTimeout(() => welcomeRef.current?.focus(), 50);
    onTaskCard?.(promptKey);
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    onSubmit(welcomeInput.trim());
  };

  return (
    <div style={{ position: "relative", zIndex: 1, flex: 1, display: "flex", flexDirection: "column", padding: "28px 64px 32px", maxWidth: 900, margin: "0 auto", width: "100%", overflowY: "auto" }}>
      <ClaudeLogo size={48} />
      <h1 style={{ fontFamily: C.serif, fontStyle: "italic", fontWeight: 290, fontSize: 42, color: C.text, marginTop: 12, marginBottom: 28, letterSpacing: -0.5, lineHeight: 1.15 }}>
        Find the story hidden in the numbers
      </h1>

      {/* Info banner */}
      <div style={{ background: C.bgComposer, borderRadius: 16, border: `0.5px solid ${C.border}`, padding: "16px 20px", marginBottom: 24, display: "flex", alignItems: "flex-start", gap: 12, boxShadow: C.shadowSoft }}>
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
          <path d="M10 2L2 18h16L10 2z" stroke={C.textMuted} strokeWidth="1.2" fill="none" />
          <path d="M10 8v4M10 14v1" stroke={C.textMuted} strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <span style={{ color: C.textSec, fontSize: 14, lineHeight: 1.5 }}>
          ClaudeQuant is an early product prototype. Quant acts as a PhD-level data scientist, helping you understand the world through the past (e.g., design experiments, analyze data statistically rigorously) and predict the future through that understanding (e.g., extrapolate models, build algorithmic or probabilistic predictors). Upload a CSV or any quantitative dataset and Claude will work with you to find the story hidden in the numbers.
        </span>
      </div>

      {/* Task cards section */}
      <div ref={cardsRef} style={{ background: C.bgComposer, borderRadius: 16, border: `0.5px solid ${C.border}`, padding: "20px 24px", marginBottom: 24, boxShadow: C.shadowSoft }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 6l4-4 4 4M4 10l4 4 4-4" stroke={C.textMuted} strokeWidth="1.2" strokeLinecap="round" /></svg>
            <span style={{ color: C.text, fontSize: 14, fontWeight: 500 }}>What will you discover?</span>
          </div>
          <button onClick={onUploadCSV} style={{ background: "transparent", border: "none", color: C.textMuted, cursor: "pointer", fontSize: 13, fontFamily: C.sans, display: "flex", alignItems: "center", gap: 4 }}
            onMouseOver={e => e.currentTarget.style.color = C.textSec} onMouseOut={e => e.currentTarget.style.color = C.textMuted}>
            + Upload your own
          </button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {[
            { icon: <CardIcon1 />, label: "Trade the market quantitatively", sub: "Backtest strategies, analyze equities, build signals", action: () => handleTaskCard("trade") },
            { icon: <CardIcon2 />, label: "Analyze experimental data", sub: "Statistical tests, significance, effect sizes", action: () => handleTaskCard("experiment") },
            { icon: <CardIcon3 />, label: "Design experiments to test hypotheses", sub: "Power analysis, sample sizes, controls", action: () => handleTaskCard("design") },
            { icon: <CardIcon4 />, label: "Predict the weather", sub: "Time series, forecasting, probabilistic models", action: () => handleTaskCard("weather") },
          ].map((card, i) => (
            <button key={i} onClick={card.action}
              style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderRadius: 12, border: `0.5px solid ${C.border}`, background: C.bg, cursor: "pointer", textAlign: "left", transition: "all 0.15s", fontFamily: C.sans }}
              onMouseOver={e => e.currentTarget.style.borderColor = C.borderHover} onMouseOut={e => e.currentTarget.style.borderColor = C.border}>
              {card.icon}
              <div>
                <div style={{ color: C.text, fontWeight: 500, fontSize: 13, marginBottom: 2 }}>{card.label}</div>
                <div style={{ color: C.textMuted, fontSize: 11 }}>{card.sub}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Composer input */}
      <div style={{ marginTop: "auto", flexShrink: 0 }}>
        <form onSubmit={handleSubmit}>
          <div style={{ background: C.bgComposer, borderRadius: 20, boxShadow: C.shadow, padding: "16px 20px 12px" }}>
            <textarea ref={welcomeRef} value={welcomeInput} onChange={e => setWelcomeInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(e); } }}
              placeholder="Describe your data analysis goal..."
              rows={1}
              style={{ width: "100%", background: "transparent", border: "none", outline: "none", color: C.text, fontSize: 14, padding: 0, marginBottom: 12, fontFamily: C.sans, lineHeight: 1.6, resize: "none", overflow: "hidden" }} />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <button type="button" onClick={onUploadCSV} style={{ display: "flex", alignItems: "center", gap: 6, background: "transparent", border: "none", color: C.textMuted, cursor: "pointer", fontSize: 13, fontFamily: C.sans }}>
                  <Upload size={14} /> Upload CSV
                  <ChevronDown size={12} />
                </button>
                <span style={{ color: C.textMuted, fontSize: 16, cursor: "pointer" }}>+</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ color: C.textMuted, fontSize: 13, fontFamily: C.sans }}>Powered by Claude <ChevronDown size={11} style={{ display: "inline", verticalAlign: "middle" }} /></span>
                <button type="submit"
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 18px", borderRadius: 20, border: "none", background: C.accent, color: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 500, fontFamily: C.sans, transition: "background 0.15s" }}
                  onMouseOver={e => e.currentTarget.style.background = C.accentHover} onMouseOut={e => e.currentTarget.style.background = C.accent}>
                  Let's crunch! <ArrowRight size={15} />
                </button>
              </div>
            </div>
          </div>
        </form>
        <div style={{ textAlign: "center", padding: "8px 0 0", fontSize: 12, color: C.textMuted, fontFamily: C.sans }}>
          Claude is AI and can make mistakes. Please double-check responses. <span style={{ textDecoration: "underline", cursor: "pointer" }}>Give us feedback</span>
        </div>
      </div>
    </div>
  );
}
