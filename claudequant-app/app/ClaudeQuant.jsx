"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { Upload, X, Database } from "lucide-react";
import * as Papa from "papaparse";

// ─── Design system & extracted modules ──────────────────────────────────────
import { C } from "@/components/design-system";
import { mean, median, std, corr, linReg, getNumericCols, fmt } from "@/lib/stats";
import { genStocks, genResearch } from "@/lib/data-generators";
import { parseMessageContent, getDisplayText } from "@/components/questions/QuestionParser";

// ─── Components ─────────────────────────────────────────────────────────────
import { ClaudeLogo } from "@/components/icons/ClaudeLogo";
import { StreamingDots } from "@/components/chat/StreamingDots";
import { renderMarkdown } from "@/components/chat/MarkdownRenderer";
import { ChartRenderer } from "@/components/charts/ChartRenderer";
import { ChartZoomModal } from "@/components/charts/ChartZoomModal";
import { QuestionOverlay } from "@/components/questions/QuestionOverlay";
import { Composer } from "@/components/composer/Composer";
import { WelcomeScreen } from "@/components/welcome/WelcomeScreen";
import { LeftSidebar } from "@/components/layout/LeftSidebar";
import { RightSidebar } from "@/components/layout/RightSidebar";
import { TopBar } from "@/components/layout/TopBar";
import { ExportMenu } from "@/components/export/ExportMenu";
import { SkillBadge } from "@/components/chat/SkillBadge";

// ═════════════════════════════════════════════════════════════════════════════
export default function ClaudeQuant() {
  // ── Core state ──
  const [data, setData] = useState(null);
  const [dsName, setDsName] = useState("");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [welcomeInput, setWelcomeInput] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expanded, setExpanded] = useState({ info: true, vars: true, actions: true });
  const [conversationMode, setConversationMode] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [navOpen, setNavOpen] = useState(true);
  const [activeSession, setActiveSession] = useState("current");
  const [sessions] = useState([
    { id: "current", title: "Craft Anthropic dream job applicat...", active: true },
    { id: "s2", title: "Backtest momentum strategy on S&P..." },
    { id: "s3", title: "Analyze A/B test results for signu..." },
    { id: "s4", title: "Design RCT for drug trial sample s..." },
    { id: "s5", title: "Predict Bay Area rainfall patterns..." },
    { id: "s6", title: "Correlation analysis on student GP..." },
    { id: "s7", title: "Portfolio optimization with min va..." },
    { id: "s8", title: "Power analysis for clinical endpoi..." },
    { id: "s9", title: "Polymarket election model vs. poll..." },
    { id: "s10", title: "Outlier detection in sensor readin..." },
    { id: "s11", title: "ARIMA forecast for quarterly reven..." },
    { id: "s12", title: "Experiment design for pricing stra..." },
  ]);

  // ── Refs ──
  const scrollRef = useRef(null);
  const fileRef = useRef(null);
  const abortRef = useRef(null);

  // ── Question overlay state ──
  const [pendingQuestions, setPendingQuestions] = useState([]);
  const [currentQIdx, setCurrentQIdx] = useState(0);
  const [questionAnswers, setQuestionAnswers] = useState([]);

  // ── File attachment state ──
  const [attachedFiles, setAttachedFiles] = useState([]);

  // ── UI polish state ──
  const [activeSkill, setActiveSkill] = useState(null);
  const [zoomedChart, setZoomedChart] = useState(null);

  // ── Derived state ──
  const numCols = useMemo(() => getNumericCols(data), [data]);
  const allCols = useMemo(() => data?.length ? Object.keys(data[0]) : [], [data]);

  // ── Auto-scroll on new messages ──
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  // ── Build data context for API calls ──
  function buildDataContext(d, name) {
    if (!d || !d.length) return null;
    const nc = getNumericCols(d);
    const numericSummary = {};
    nc.forEach(col => {
      const vals = d.map(r => r[col]).filter(v => v != null && !isNaN(v));
      if (vals.length) {
        numericSummary[col] = {
          mean: +mean(vals).toFixed(4), median: +median(vals).toFixed(4),
          std: +std(vals).toFixed(4), min: +Math.min(...vals).toFixed(4), max: +Math.max(...vals).toFixed(4),
        };
      }
    });
    return { name, rowCount: d.length, columns: Object.keys(d[0]), numericSummary, sampleRows: d.slice(0, 5) };
  }

  // ── Stream a message to the Claude API ──
  const streamMessage = useCallback(async (userText, existingMessages = [], files = []) => {
    if (!userText.trim() || isStreaming) return;

    const fileNames = files.length > 0 ? files.map(f => f.name).join(", ") : "";
    const displayText = fileNames ? `${userText}\n📎 ${fileNames}` : userText;
    const userMsg = { role: "user", text: displayText, content: userText, files };
    const updatedMessages = [...existingMessages, userMsg];

    setMessages([...updatedMessages, { role: "assistant", text: "", isStreaming: true }]);
    setIsStreaming(true);
    setAttachedFiles([]);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const apiMessages = updatedMessages.map(m => {
        const textContent = m.content || m.text || "";
        if (m.files && m.files.length > 0) {
          const contentBlocks = [];
          m.files.forEach(f => {
            if (f.isImage) {
              contentBlocks.push({ type: "image", source: { type: "base64", media_type: f.mediaType, data: f.data } });
            } else {
              contentBlocks.push({ type: "document", source: { type: "base64", media_type: f.mediaType, data: f.data } });
            }
          });
          contentBlocks.push({ type: "text", text: textContent });
          return { role: m.role, content: contentBlocks };
        }
        return { role: m.role, content: textContent };
      });

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages, dataContext: buildDataContext(data, dsName), latestQuery: userText }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Request failed" }));
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice(6).trim();
          if (payload === "[DONE]") break;
          try {
            const d = JSON.parse(payload);
            if (d.type === "start" && d.skill) {
              setActiveSkill(d.skill);
            } else if (d.type === "text") {
              fullText += d.text;
              setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: "assistant", text: getDisplayText(fullText), content: fullText, isStreaming: true };
                return updated;
              });
            } else if (d.type === "error") {
              throw new Error(d.error);
            }
          } catch (parseErr) {
            if (parseErr instanceof SyntaxError) continue;
            throw parseErr;
          }
        }
      }

      const parsed = parseMessageContent(fullText);
      const questions = parsed.segments.filter(s => s.type === "question");
      const cleanDisplay = getDisplayText(fullText);

      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: "assistant", text: cleanDisplay, content: fullText, isStreaming: false };
        return updated;
      });

      if (questions.length > 0) {
        setPendingQuestions(questions);
        setCurrentQIdx(0);
        setQuestionAnswers([]);
      }
    } catch (err) {
      if (err.name === "AbortError") {
        setMessages(prev => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last?.role === "assistant") updated[updated.length - 1] = { ...last, isStreaming: false };
          return updated;
        });
      } else {
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: "assistant", text: `Something went wrong: ${err.message}. Please try again.`, content: `Something went wrong: ${err.message}. Please try again.`, isStreaming: false, isError: true };
          return updated;
        });
      }
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  }, [isStreaming, data, dsName]);

  const stopStreaming = useCallback(() => { abortRef.current?.abort(); }, []);

  // ── Question overlay handlers ──
  const handleQuestionAnswer = useCallback((answer) => {
    const question = pendingQuestions[currentQIdx];
    const newAnswers = [...questionAnswers, { title: question.title, answer }];
    setQuestionAnswers(newAnswers);
    if (currentQIdx + 1 < pendingQuestions.length) {
      setCurrentQIdx(prev => prev + 1);
    } else {
      const combinedText = newAnswers.filter(a => a.answer !== null).map(a => `**${a.title}**: ${a.answer}`).join('\n');
      setPendingQuestions([]); setCurrentQIdx(0); setQuestionAnswers([]);
      if (combinedText.trim()) streamMessage(combinedText, messages);
    }
  }, [pendingQuestions, currentQIdx, questionAnswers, messages, streamMessage]);

  const handleQuestionSkip = useCallback(() => {
    const newAnswers = [...questionAnswers, { title: pendingQuestions[currentQIdx].title, answer: null }];
    setQuestionAnswers(newAnswers);
    if (currentQIdx + 1 < pendingQuestions.length) {
      setCurrentQIdx(prev => prev + 1);
    } else {
      const combinedText = newAnswers.filter(a => a.answer !== null).map(a => `**${a.title}**: ${a.answer}`).join('\n');
      setPendingQuestions([]); setCurrentQIdx(0); setQuestionAnswers([]);
      if (combinedText.trim()) streamMessage(combinedText, messages);
    }
  }, [pendingQuestions, currentQIdx, questionAnswers, messages, streamMessage]);

  // ── Local analysis logic ──
  const buildInitialAnalysis = (d, name) => {
    const nc = getNumericCols(d);
    const msgs = [];
    msgs.push({ role: "assistant", text: `I've loaded **${name}** — ${d.length} rows and ${Object.keys(d[0]).length} columns. Let me run an initial analysis.` });
    const stats = nc.map(c => {
      const vals = d.map(r => r[c]).filter(v => v != null && !isNaN(v));
      return { col: c, mean: mean(vals), median: median(vals), std: std(vals), min: Math.min(...vals), max: Math.max(...vals) };
    });
    msgs.push({ role: "assistant", text: "Statistical overview:", table: { headers: ["Variable", "Mean", "Median", "Std Dev", "Min", "Max"], rows: stats.map(s => [s.col, fmt(s.mean), fmt(s.median), fmt(s.std), fmt(s.min), fmt(s.max)]) } });
    if (nc.length >= 2) {
      const pairs = [];
      for (let i = 0; i < nc.length; i++) for (let j = i + 1; j < nc.length; j++) {
        const vx = d.map(r => r[nc[i]]).filter(v => v != null && !isNaN(v));
        const vy = d.map(r => r[nc[j]]).filter(v => v != null && !isNaN(v));
        const minLen = Math.min(vx.length, vy.length);
        if (minLen > 5) pairs.push({ a: nc[i], b: nc[j], r: corr(vx.slice(0, minLen), vy.slice(0, minLen)) });
      }
      pairs.sort((a, b) => Math.abs(b.r) - Math.abs(a.r));
      const top = pairs.slice(0, 3);
      if (top.length) {
        const s = top[0], dir = s.r > 0 ? "positive" : "negative";
        msgs.push({ role: "assistant", text: `**Key correlation:** **${s.a}** and **${s.b}** (r = ${s.r.toFixed(3)}, ${dir}).`, chip: top.map(p => `${p.a} ↔ ${p.b}: ${p.r.toFixed(2)}`) });
      }
    }
    const hasDate = Object.keys(d[0]).some(k => k.toLowerCase().includes("date"));
    if (hasDate && nc.length >= 1) {
      msgs.push({ role: "assistant", text: "Trend over time:", chart: { type: "area", data: d, keys: nc.filter(c => !c.toLowerCase().includes("volume")).slice(0, 4) } });
    } else if (nc.length >= 2) {
      msgs.push({ role: "assistant", text: `**${nc[0]}** vs **${nc[1]}**:`, chart: { type: "scatter", data: d, x: nc[0], y: nc[1] } });
    }
    msgs.push({ role: "assistant", text: "What would you like to explore? Ask me anything about this dataset, or try one of these:", suggestions: ["Show correlation matrix", "Distribution of " + (nc[0] || ""), "Predict " + (nc[nc.length - 1] || ""), "Compare all variables"] });
    return msgs;
  };

  const loadDataset = (type) => {
    const d = type === "stocks" ? genStocks() : genResearch();
    const name = type === "stocks" ? "Market Data (AAPL, GOOGL, MSFT, SPY)" : "Student Research Data";
    setData(d); setDsName(name); setMessages(buildInitialAnalysis(d, name));
  };

  const handleCSV = (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = Papa.parse(ev.target.result, { header: true, dynamicTyping: true, skipEmptyLines: true });
      if (result.data?.length) { setData(result.data); setDsName(file.name); setMessages(buildInitialAnalysis(result.data, file.name)); }
    };
    reader.readAsText(file);
  };

  const processQuery = (query) => {
    const q = query.toLowerCase();
    if (q.includes("upload a csv") || q.includes("upload csv")) { fileRef.current?.click(); return; }
    if (q.includes("sample data") || q.includes("market equities") || q.includes("load market")) { loadDataset("stocks"); return; }
    if (q.includes("research study") || q.includes("load research")) { loadDataset("research"); return; }

    if (data) {
      const nc = getNumericCols(data);
      const mentioned = nc.filter(c => q.includes(c.toLowerCase()));

      if (q.includes("correlat") || q.includes("heatmap") || q.includes("matrix")) {
        const matrix = nc.map(c1 => nc.map(c2 => {
          const v1 = data.map(r => r[c1]).filter(v => v != null && !isNaN(v));
          const v2 = data.map(r => r[c2]).filter(v => v != null && !isNaN(v));
          return corr(v1.slice(0, Math.min(v1.length, v2.length)), v2.slice(0, Math.min(v1.length, v2.length)));
        }));
        setMessages(prev => [...prev, { role: "user", text: query }, { role: "assistant", text: "Full correlation matrix:", chart: { type: "heatmap", labels: nc, matrix } }]);
        return;
      } else if (q.includes("distribut") || q.includes("histogram")) {
        const col = mentioned[0] || nc[0];
        const vals = data.map(r => r[col]).filter(v => v != null && !isNaN(v));
        const mn = Math.min(...vals), mx = Math.max(...vals), bins = 12, bw = (mx - mn) / bins || 1;
        const hist = Array.from({ length: bins }, (_, i) => { const lo = mn + i * bw, hi = lo + bw; return { range: `${lo.toFixed(1)}`, count: vals.filter(v => v >= lo && (i === bins - 1 ? v <= hi : v < hi)).length }; });
        setMessages(prev => [...prev, { role: "user", text: query }, { role: "assistant", text: `Distribution of **${col}** — mean: ${fmt(mean(vals))}, std: ${fmt(std(vals))}`, chart: { type: "bar", data: hist, x: "range", y: "count" } }]);
        return;
      } else if (q.includes("scatter") || q.includes("relationship") || q.includes(" vs ") || q.includes("versus")) {
        const cx = mentioned[0] || nc[0], cy = mentioned[1] || nc[1];
        if (cx && cy) { const r = corr(data.map(d => d[cx]).filter(v => !isNaN(v)), data.map(d => d[cy]).filter(v => !isNaN(v))); setMessages(prev => [...prev, { role: "user", text: query }, { role: "assistant", text: `**${cx}** vs **${cy}** — r = ${r.toFixed(3)}`, chart: { type: "scatter", data, x: cx, y: cy } }]); }
        return;
      } else if (q.includes("trend") || q.includes("time") || q.includes("line") || q.includes("over time")) {
        const keys = mentioned.length ? mentioned : nc.filter(c => !c.toLowerCase().includes("volume") && !c.toLowerCase().includes("id")).slice(0, 4);
        setMessages(prev => [...prev, { role: "user", text: query }, { role: "assistant", text: `Trend for ${keys.join(", ")}:`, chart: { type: "area", data, keys } }]);
        return;
      } else if (q.includes("predict") || q.includes("regress") || q.includes("forecast")) {
        const target = mentioned[0] || nc[nc.length - 1], predictor = mentioned[1] || nc.find(c => c !== target) || nc[0];
        const vx = data.map(r => r[predictor]).filter(v => !isNaN(v)), vy = data.map(r => r[target]).filter(v => !isNaN(v));
        const minLen = Math.min(vx.length, vy.length), reg = linReg(vx.slice(0, minLen), vy.slice(0, minLen));
        const predData = data.map(r => ({ ...r, predicted: +(reg.intercept + reg.slope * r[predictor]).toFixed(2) }));
        setMessages(prev => [...prev, { role: "user", text: query }, { role: "assistant", text: `**Regression:** ${target} = ${reg.slope.toFixed(4)} × ${predictor} + ${reg.intercept.toFixed(2)}\nR² = ${reg.r2.toFixed(4)}`, chart: { type: "regression", data: predData, x: predictor, y: target, predicted: "predicted" } }]);
        return;
      } else if (q.includes("compar") || q.includes("all") || q.includes("overview") || q.includes("summary")) {
        const stats = nc.map(c => { const vals = data.map(r => r[c]).filter(v => v != null && !isNaN(v)); return { col: c, mean: mean(vals), median: median(vals), std: std(vals), min: Math.min(...vals), max: Math.max(...vals) }; });
        setMessages(prev => [...prev, { role: "user", text: query }, { role: "assistant", text: "Complete summary:", table: { headers: ["Variable", "Mean", "Median", "Std Dev", "Min", "Max"], rows: stats.map(s => [s.col, fmt(s.mean), fmt(s.median), fmt(s.std), fmt(s.min), fmt(s.max)]) } }]);
        return;
      } else if (q.includes("outlier") || q.includes("anomal")) {
        const col = mentioned[0] || nc[0], vals = data.map(r => r[col]).filter(v => !isNaN(v));
        const m = mean(vals), s = std(vals), outliers = data.filter(r => Math.abs(r[col] - m) > 2 * s);
        setMessages(prev => [...prev, { role: "user", text: query }, { role: "assistant", text: `**Outlier detection for ${col}** (±2σ): ${outliers.length} outlier${outliers.length !== 1 ? "s" : ""} / ${data.length} observations.` }]);
        return;
      }
    }

    streamMessage(query, messages, attachedFiles);
  };

  const handleWelcomeSubmit = (prompt) => {
    if (!prompt) { loadDataset("stocks"); return; }
    setConversationMode(true);
    setWelcomeInput("");
    streamMessage(prompt, []);
  };

  // ═══════════════════════════════════ RENDER ═════════════════════════════════
  return (
    <div style={{ display: "flex", height: "100vh", background: C.bg, color: C.text, fontFamily: C.sans, overflow: "hidden" }}>
      {/* Chart zoom modal */}
      {zoomedChart && <ChartZoomModal chart={zoomedChart} onClose={() => setZoomedChart(null)} />}

      <LeftSidebar navOpen={navOpen} setNavOpen={setNavOpen} sessions={sessions} activeSession={activeSession} setActiveSession={setActiveSession} />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", position: "relative", overflow: "hidden", minWidth: 0 }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: C.grid, backgroundSize: "32px 32px", pointerEvents: "none", zIndex: 0 }} />
        <TopBar navOpen={navOpen} setNavOpen={setNavOpen} />

        <input ref={fileRef} type="file" accept=".csv,.tsv,.txt" onChange={handleCSV} style={{ display: "none" }} />

        {!data && !conversationMode ? (
          <WelcomeScreen
            welcomeInput={welcomeInput}
            setWelcomeInput={setWelcomeInput}
            onSubmit={handleWelcomeSubmit}
            onUploadCSV={() => fileRef.current?.click()}
          />
        ) : (
          <div style={{ position: "relative", zIndex: 1, display: "flex", flex: 1, overflow: "hidden" }}>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
              {/* Header */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 20px", flexShrink: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <ClaudeLogo size={22} />
                  <span style={{ fontSize: 16, fontWeight: 500, letterSpacing: -0.3 }}>Claude<span style={{ fontWeight: 300, color: C.accent }}>Quant</span></span>
                  <SkillBadge skill={activeSkill} />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <button onClick={() => fileRef.current?.click()} style={{ padding: "5px 12px", borderRadius: C.radiusSm, border: `0.5px solid ${C.border}`, background: "transparent", color: C.textSec, cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", gap: 6, fontFamily: C.sans, transition: C.transitionFast }}
                    onMouseOver={e => { e.currentTarget.style.background = C.bgHover; e.currentTarget.style.borderColor = C.borderHover; }} onMouseOut={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = C.border; }}>
                    <Upload size={13} /> Upload
                  </button>
                  <ExportMenu messages={messages} data={data} dsName={dsName} />
                  {data && <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ padding: "5px 8px", borderRadius: C.radiusSm, border: `0.5px solid ${C.border}`, background: "transparent", color: C.textSec, cursor: "pointer", transition: C.transitionFast }}
                    onMouseOver={e => { e.currentTarget.style.background = C.bgHover; e.currentTarget.style.borderColor = C.borderHover; }} onMouseOut={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = C.border; }}>
                    {sidebarOpen ? <X size={14} /> : <Database size={14} />}
                  </button>}
                </div>
              </div>

              {/* Messages */}
              <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: "24px 32px" }}>
                <div style={{ maxWidth: 720, margin: "0 auto" }}>
                  {messages.map((msg, i) => (
                    <div key={i} style={{ marginBottom: 24 }}>
                      {msg.role === "user" ? (
                        <div style={{ display: "flex", justifyContent: "flex-end", animation: "fadeIn 0.2s ease" }}>
                          <div style={{ maxWidth: "75%", background: C.bgComposer, borderRadius: 20, padding: "10px 16px", border: `0.5px solid ${C.border}` }}>
                            <div style={{ fontSize: 14, lineHeight: 1.6, color: C.text, fontFamily: C.sans }}>{msg.text}</div>
                          </div>
                        </div>
                      ) : (
                        <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                          <div style={{ flexShrink: 0, marginTop: 3 }}><ClaudeLogo size={18} /></div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            {msg.text && (
                              <div style={{ fontSize: 14, lineHeight: 1.7, color: C.textSec, fontFamily: C.sans }}>
                                {renderMarkdown(msg.text)}{msg.isStreaming && <StreamingDots />}
                              </div>
                            )}
                            {!msg.text && msg.isStreaming && <div style={{ fontSize: 14, color: C.textMuted }}><StreamingDots /></div>}
                            {msg.isError && <div style={{ color: C.red, fontSize: 12, marginTop: 4 }}>Error occurred</div>}
                            {msg.table && <div style={{ overflowX: "auto", marginTop: 14, background: C.bgComposer, borderRadius: C.radius, boxShadow: C.shadowSoft, padding: "4px 0", border: `0.5px solid ${C.border}` }}><table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}><thead><tr>{msg.table.headers.map((h, j) => <th key={j} style={{ padding: "10px 14px", textAlign: j === 0 ? "left" : "right", color: C.textMuted, borderBottom: `1px solid ${C.border}`, fontWeight: 600, fontFamily: C.sans, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5 }}>{h}</th>)}</tr></thead><tbody>{msg.table.rows.map((row, j) => <tr key={j}>{row.map((cell, k) => <td key={k} style={{ padding: "8px 14px", textAlign: k === 0 ? "left" : "right", color: k === 0 ? C.text : C.textSec, fontFamily: k > 0 ? C.mono : C.sans, fontSize: 12, borderBottom: j < msg.table.rows.length - 1 ? `0.5px solid rgba(255,255,255,0.04)` : "none" }}>{cell}</td>)}</tr>)}</tbody></table></div>}
                            {msg.chart && <div onClick={() => setZoomedChart(msg.chart)} style={{ marginTop: 14, background: C.bgComposer, borderRadius: C.radius, boxShadow: C.shadowSoft, padding: "16px 8px 8px 0", border: `0.5px solid ${C.border}`, cursor: "pointer", transition: C.transition }} onMouseOver={e => e.currentTarget.style.borderColor = C.borderHover} onMouseOut={e => e.currentTarget.style.borderColor = C.border}><ChartRenderer chart={msg.chart} /></div>}
                            {msg.chip && <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>{msg.chip.map((c, j) => <span key={j} style={{ padding: "4px 10px", borderRadius: C.radiusSm, background: "rgba(255,255,255,0.04)", fontSize: 12, color: C.textMuted, fontFamily: C.mono, border: `0.5px solid ${C.border}` }}>{c}</span>)}</div>}
                            {msg.suggestions && !msg.isStreaming && <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 14 }}>{msg.suggestions.map((s, j) => <button key={j} onClick={() => processQuery(s)} style={{ padding: "7px 14px", borderRadius: C.radiusPill, border: `0.5px solid ${C.border}`, background: "transparent", color: C.textSec, fontSize: 12, cursor: "pointer", fontFamily: C.sans, transition: C.transitionFast }} onMouseOver={e => { e.currentTarget.style.borderColor = C.borderHover; e.currentTarget.style.color = C.text; e.currentTarget.style.background = C.bgHover; }} onMouseOut={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.textSec; e.currentTarget.style.background = "transparent"; }}>{s}</button>)}</div>}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Composer / Question Overlay */}
              <div style={{ padding: "12px 32px 20px", flexShrink: 0 }}>
                <div style={{ maxWidth: 720, margin: "0 auto" }}>
                  {pendingQuestions.length > 0 && currentQIdx < pendingQuestions.length ? (
                    <QuestionOverlay
                      question={pendingQuestions[currentQIdx]}
                      questionIndex={currentQIdx}
                      totalQuestions={pendingQuestions.length}
                      onSelect={handleQuestionAnswer}
                      onSkip={handleQuestionSkip}
                    />
                  ) : (
                    <Composer
                      input={input}
                      setInput={setInput}
                      isStreaming={isStreaming}
                      onSubmit={(q) => processQuery(q)}
                      onStop={stopStreaming}
                      attachedFiles={attachedFiles}
                      setAttachedFiles={setAttachedFiles}
                    />
                  )}
                </div>
              </div>
            </div>

            {sidebarOpen && data && (
              <RightSidebar
                data={data}
                dsName={dsName}
                allCols={allCols}
                numCols={numCols}
                expanded={expanded}
                setExpanded={setExpanded}
                processQuery={processQuery}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
