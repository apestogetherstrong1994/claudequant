// ─── Export utilities for conversations and charts ──────────────────────────

/**
 * Export conversation as Markdown file
 */
export function exportAsMarkdown(messages, dsName) {
  let md = `# ClaudeQuant Analysis\n`;
  if (dsName) md += `**Dataset:** ${dsName}\n`;
  md += `**Date:** ${new Date().toLocaleDateString()}\n\n---\n\n`;

  for (const msg of messages) {
    if (msg.role === "user") {
      md += `### User\n${msg.text || msg.content || ""}\n\n`;
    } else {
      md += `### Quant\n${msg.text || msg.content || ""}\n\n`;
      if (msg.table) {
        const { headers, rows } = msg.table;
        md += `| ${headers.join(" | ")} |\n`;
        md += `| ${headers.map(() => "---").join(" | ")} |\n`;
        for (const row of rows) {
          md += `| ${row.join(" | ")} |\n`;
        }
        md += "\n";
      }
    }
  }

  downloadFile(md, "claudequant-analysis.md", "text/markdown");
}

/**
 * Export conversation as JSON file
 */
export function exportAsJSON(messages, data, dsName) {
  const payload = {
    exportDate: new Date().toISOString(),
    dataset: dsName || null,
    dataRowCount: data?.length || 0,
    messages: messages.map(m => ({
      role: m.role,
      text: m.text || m.content || "",
      ...(m.table && { table: m.table }),
      ...(m.chart && { chartType: m.chart.type }),
    })),
  };

  downloadFile(
    JSON.stringify(payload, null, 2),
    "claudequant-analysis.json",
    "application/json"
  );
}

/**
 * Export chart as PNG using canvas
 */
export function exportChartAsPNG(chartContainerEl, filename = "chart.png") {
  if (!chartContainerEl) return;

  const svg = chartContainerEl.querySelector("svg");
  if (!svg) return;

  const svgData = new XMLSerializer().serializeToString(svg);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  const img = new window.Image();

  const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(svgBlob);

  img.onload = () => {
    canvas.width = img.width * 2;
    canvas.height = img.height * 2;
    ctx.scale(2, 2);
    ctx.fillStyle = "#262624";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
    URL.revokeObjectURL(url);

    canvas.toBlob((blob) => {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      a.click();
      URL.revokeObjectURL(a.href);
    }, "image/png");
  };

  img.src = url;
}

/**
 * Download a file with given content
 */
function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
