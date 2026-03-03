import Anthropic from "@anthropic-ai/sdk";
import { SYSTEM_PROMPT } from "@/lib/system-prompt";
import { detectSkill, buildSystemBlocks } from "@/lib/skills";

// Allow up to 60s for streaming responses (Vercel Pro), Hobby plan caps at 10s
export const maxDuration = 60;

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Helper: build a data context block from uploaded dataset metadata
function buildDataContext(dataContext) {
  if (!dataContext) return "";
  const { name, rowCount, columns, sampleRows, numericSummary } = dataContext;
  let ctx = `\n\n[DATA CONTEXT]\nDataset: ${name}\nRows: ${rowCount}\nColumns: ${columns.join(", ")}\n`;
  if (numericSummary) {
    ctx += `\nNumeric summary:\n`;
    for (const [col, stats] of Object.entries(numericSummary)) {
      ctx += `  ${col}: mean=${stats.mean}, median=${stats.median}, std=${stats.std}, min=${stats.min}, max=${stats.max}\n`;
    }
  }
  if (sampleRows && sampleRows.length > 0) {
    ctx += `\nSample rows (first 5):\n`;
    ctx += JSON.stringify(sampleRows.slice(0, 5), null, 2);
  }
  ctx += `\n[/DATA CONTEXT]`;
  return ctx;
}

export async function POST(request) {
  try {
    const { messages, dataContext, latestQuery } = await request.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "Messages array is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Detect relevant skill from the user's latest query
    const skill = detectSkill(latestQuery || "");

    // Build system prompt blocks with cache breakpoints
    const systemBlocks = buildSystemBlocks(SYSTEM_PROMPT, skill);

    // Format messages for the Anthropic API
    const formattedMessages = messages.map((msg, i) => {
      let content = msg.content || msg.text || "";
      if (Array.isArray(content)) {
        if (msg.role === "user" && i === messages.length - 1 && dataContext) {
          content = content.map(block => {
            if (block.type === "text") {
              return { ...block, text: block.text + buildDataContext(dataContext) };
            }
            return block;
          });
        }
        return { role: msg.role, content };
      }
      if (msg.role === "user" && i === messages.length - 1 && dataContext) {
        content += buildDataContext(dataContext);
      }
      return { role: msg.role, content };
    });

    // Stream the response using the Anthropic SDK
    // - Model upgraded to Claude Opus 4.6
    // - System prompt as array with cache_control breakpoints
    // - Code execution tool enabled
    // - Max tokens increased to 16384
    const stream = await client.messages.stream({
      model: "claude-opus-4-6",
      max_tokens: 16384,
      system: systemBlocks,
      messages: formattedMessages,
    });

    // Create a ReadableStream that sends Server-Sent Events
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (event.type === "content_block_delta") {
              const text = event.delta?.text || "";
              if (text) {
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ type: "text", text })}\n\n`)
                );
              }
            } else if (event.type === "message_start") {
              // Include skill info and cache usage in the start event
              const startData = {
                type: "start",
                model: event.message?.model,
                skill: skill ? { id: skill.id, name: skill.name } : null,
              };
              // Include cache usage stats if available
              if (event.message?.usage) {
                startData.usage = event.message.usage;
              }
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify(startData)}\n\n`)
              );
            } else if (event.type === "message_stop") {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ type: "stop" })}\n\n`)
              );
            } else if (event.type === "message_delta") {
              if (event.usage) {
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ type: "usage", usage: event.usage })}\n\n`)
                );
              }
            }
          }
          controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
          controller.close();
        } catch (err) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "error", error: err.message })}\n\n`)
          );
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
