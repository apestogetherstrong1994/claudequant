// ─── Pre-clean: strip code fences that wrap structured blocks ─────────────────
export function preCleanQuestionText(text) {
  if (!text) return text;
  let clean = text.replace(/```\s*\n?\s*\[QUESTION\]/g, '[QUESTION]');
  clean = clean.replace(/\[\/QUESTION\]\s*\n?\s*```/g, '[/QUESTION]');
  clean = clean.replace(/```[\s\S]*?\[QUESTION\]/g, '[QUESTION]');
  // Also clean insight/hypothesis code fences
  clean = clean.replace(/```\s*\n?\s*\[INSIGHT\]/g, '[INSIGHT]');
  clean = clean.replace(/\[\/INSIGHT\]\s*\n?\s*```/g, '[/INSIGHT]');
  clean = clean.replace(/```\s*\n?\s*\[HYPOTHESIS\]/g, '[HYPOTHESIS]');
  clean = clean.replace(/\[\/HYPOTHESIS\]\s*\n?\s*```/g, '[/HYPOTHESIS]');
  return clean;
}

// ─── Question parser: extracts [QUESTION] blocks from Claude's response ─────
export function parseMessageContent(text) {
  if (!text) return { segments: [], hasQuestions: false };
  const cleaned = preCleanQuestionText(text);
  const segments = [];
  const regex = /\[QUESTION\]\s*([\s\S]*?)\s*\[\/QUESTION\]/g;
  let lastIndex = 0;
  let match;
  let hasQuestions = false;

  while ((match = regex.exec(cleaned)) !== null) {
    hasQuestions = true;
    if (match.index > lastIndex) {
      const before = cleaned.slice(lastIndex, match.index).trim();
      if (before) segments.push({ type: "text", content: before });
    }
    const block = match[1];
    const titleMatch = block.match(/title:\s*(.+)/);
    const descMatch = block.match(/description:\s*(.+)/);
    const optionsRaw = block.match(/options:\s*([\s\S]*)/);
    const options = [];
    if (optionsRaw) {
      const lines = optionsRaw[1].split("\n").map(l => l.trim()).filter(l => l.startsWith("- "));
      for (const line of lines) {
        const parts = line.slice(2).split("|").map(s => s.trim());
        options.push({ label: parts[0], description: parts[1] || "" });
      }
    }
    segments.push({
      type: "question",
      title: titleMatch ? titleMatch[1].trim() : "Question",
      description: descMatch ? descMatch[1].trim() : "",
      options,
    });
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < cleaned.length) {
    const remaining = cleaned.slice(lastIndex).trim();
    if (remaining) segments.push({ type: "text", content: remaining });
  }

  if (!hasQuestions) {
    segments.push({ type: "text", content: text });
  }

  return { segments, hasQuestions };
}

// ─── Extract hypotheses from Claude's response for sidebar tracker ───────────
export function extractHypotheses(text) {
  if (!text) return [];
  const cleaned = preCleanQuestionText(text);
  const hypotheses = [];
  const regex = /\[HYPOTHESIS\]\s*([\s\S]*?)\s*\[\/HYPOTHESIS\]/g;
  let match;
  while ((match = regex.exec(cleaned)) !== null) {
    const h = match[1].trim();
    if (h) hypotheses.push(h);
  }
  return hypotheses;
}

// ─── Strip structured blocks for clean display during streaming ──────────────
export function getDisplayText(text) {
  if (!text) return '';
  let result = preCleanQuestionText(text);

  // Convert [INSIGHT] blocks to single-line display markers
  result = result.replace(
    /\[INSIGHT\]\s*([\s\S]*?)\s*\[\/INSIGHT\]/g,
    (_, content) => `\n[INSIGHT_DISPLAY]${content.replace(/\n/g, ' ').trim()}[/INSIGHT_DISPLAY]\n`
  );

  // Strip [HYPOTHESIS] blocks entirely (displayed in sidebar)
  result = result.replace(/\[HYPOTHESIS\]\s*[\s\S]*?\s*\[\/HYPOTHESIS\]/g, '');

  // Strip everything from first [QUESTION] onward
  const qIdx = result.search(/\[QUESTION\]/);
  if (qIdx !== -1) {
    result = result.slice(0, qIdx).replace(/\s*[-]{3,}\s*$/, '');
  }

  // Strip partial structured tags at end during streaming
  result = result.replace(/\[(?:QUESTION|INSIGHT|HYPOTHESIS|INSIGHT_DISPLAY|\/INSIGHT_DISPLAY|\/INSIGHT|\/HYPOTHESIS|\/QUESTION)[^\]]*$/, '');
  result = result.replace(/\[[A-Z\/]{0,20}$/, '');

  // Strip trailing code fence fragments
  const fenceIdx = result.search(/```\s*$/);
  if (fenceIdx !== -1 && result.length - fenceIdx < 10) {
    result = result.slice(0, fenceIdx);
  }

  return result.trim();
}
