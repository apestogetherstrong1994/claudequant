import Anthropic from "@anthropic-ai/sdk";
import { SYSTEM_PROMPT } from "@/lib/system-prompt";

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
    ctx += `\nSample rows (first 3):\n`;
    ctx += JSON.stringify(sampleRows.slice(0, 3));
  }
  ctx += `\n[/DATA CONTEXT]`;
  return ctx;
}

export async function POST(request) {
  try {
    const { messages, dataContext } = await request.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "Messages array is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Conversation windowing: only send last 10 messages to reduce token usage
    // This keeps us within the free-tier rate limit (10K input tokens/min)
    const MAX_MESSAGES = 10;
    const windowedMessages = messages.length > MAX_MESSAGES
      ? messages.slice(-MAX_MESSAGES)
      : messages;

    // Ensure conversation starts with a user message (API requirement)
    const trimmedMessages = windowedMessages[0]?.role === "assistant"
      ? windowedMessages.slice(1)
      : windowedMessages;

    // Format messages for the Anthropic API
    const formattedMessages = trimmedMessages.map((msg, i) => {
      let content = msg.content || msg.text || "";
      if (Array.isArray(content)) {
        if (msg.role === "user" && i === trimmedMessages.length - 1 && dataContext) {
          content = content.map(block => {
            if (block.type === "text") {
              return { ...block, text: block.text + buildDataContext(dataContext) };
            }
            return block;
          });
        }
        return { role: msg.role, content };
      }
      if (msg.role === "user" && i === trimmedMessages.length - 1 && dataContext) {
        content += buildDataContext(dataContext);
      }
      return { role: msg.role, content };
    });

    // Stream the response using the Anthropic SDK (text-only, no tools)
    const stream = await client.messages.stream({
      model: "claude-opus-4-6",
      max_tokens: 8192,
      system: SYSTEM_PROMPT,
      messages: formattedMessages,
    });

    // Create a ReadableStream that sends Server-Sent Events
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (event.type === "content_block_delta") {
              // Text content
              if (event.delta?.text) {
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ type: "text", text: event.delta.text })}\n\n`)
                );
              }

            } else if (event.type === "message_start") {
              const startData = {
                type: "start",
                model: event.message?.model,
              };
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
              const deltaData = {};
              if (event.usage) deltaData.usage = event.usage;
              if (event.delta?.stop_reason) deltaData.stopReason = event.delta.stop_reason;
              if (Object.keys(deltaData).length > 0) {
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ type: "message_delta", ...deltaData })}\n\n`)
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
