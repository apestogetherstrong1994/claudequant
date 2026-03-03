// ─── Pre-clean: strip code fences that wrap [QUESTION] blocks ────────────────
export function preCleanQuestionText(text) {
  if (!text) return text;
  let clean = text.replace(/```\s*\n?\s*\[QUESTION\]/g, '[QUESTION]');
  clean = clean.replace(/\[\/QUESTION\]\s*\n?\s*```/g, '[/QUESTION]');
  clean = clean.replace(/```[\s\S]*?\[QUESTION\]/g, '[QUESTION]');
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

// ─── Strip [QUESTION] blocks for clean display during streaming ─────────────
export function getDisplayText(text) {
  if (!text) return '';
  const cleaned = preCleanQuestionText(text);
  const idx = cleaned.search(/\[QUESTION\]/);
  if (idx !== -1) {
    return cleaned.slice(0, idx).replace(/\s*[-]{3,}\s*$/, '').trim();
  }
  const partialIdx = cleaned.search(/\[Q(?:U(?:E(?:S(?:T(?:I(?:O(?:N)?)?)?)?)?)?)?$/);
  if (partialIdx !== -1) {
    return cleaned.slice(0, partialIdx).trim();
  }
  const fenceIdx = cleaned.search(/```\s*$/);
  if (fenceIdx !== -1 && cleaned.length - fenceIdx < 10) {
    return cleaned.slice(0, fenceIdx).trim();
  }
  return cleaned;
}
