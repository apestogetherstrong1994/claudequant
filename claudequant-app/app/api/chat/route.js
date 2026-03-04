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

    // Server-side tools: web fetch, web search
    // Code execution is auto-injected by the API when web_fetch/web_search are present
    // Web fetch retrieves URLs (code execution is free when paired with it)
    // Web search finds data sources and APIs
    const tools = [
      { type: "web_fetch_20260209", name: "web_fetch", max_uses: 10 },
      { type: "web_search_20250305", name: "web_search", max_uses: 5 },
    ];

    // Stream the response using the Anthropic SDK
    const stream = await client.messages.stream({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 32768,
      system: systemBlocks,
      messages: formattedMessages,
      tools,
    });

    // Create a ReadableStream that sends Server-Sent Events
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (event.type === "content_block_start") {
              const block = event.content_block;

              // Server tool use (code execution, web fetch, web search)
              if (block?.type === "server_tool_use") {
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({
                    type: "tool_use_start",
                    index: event.index,
                    toolName: block.name,
                    toolId: block.id,
                  })}\n\n`)
                );
              }

              // Code execution result
              if (block?.type === "bash_code_execution_tool_result") {
                const result = block.content;
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({
                    type: "code_result",
                    toolId: block.tool_use_id,
                    stdout: result?.stdout || "",
                    stderr: result?.stderr || "",
                    returnCode: result?.return_code,
                    // Include file references if present
                    files: result?.content?.filter?.(f => f.file_id) || [],
                  })}\n\n`)
                );
              }

              // Text editor result (file operations)
              if (block?.type === "text_editor_code_execution_tool_result") {
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({
                    type: "file_result",
                    toolId: block.tool_use_id,
                    content: block.content,
                  })}\n\n`)
                );
              }

              // Web fetch result
              if (block?.type === "web_fetch_tool_result") {
                const result = block.content;
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({
                    type: "web_fetch_result",
                    toolId: block.tool_use_id,
                    url: result?.url || "",
                    title: result?.content?.title || "",
                  })}\n\n`)
                );
              }

              // Web search result
              if (block?.type === "web_search_tool_result") {
                const results = block.content;
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({
                    type: "web_search_result",
                    toolId: block.tool_use_id,
                    results: Array.isArray(results) ? results.map(r => ({
                      title: r.title,
                      url: r.url,
                    })).slice(0, 5) : [],
                  })}\n\n`)
                );
              }

            } else if (event.type === "content_block_delta") {
              // Text content
              if (event.delta?.text) {
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ type: "text", text: event.delta.text })}\n\n`)
                );
              }
              // Tool input being streamed (e.g., code being written)
              if (event.delta?.type === "input_json_delta" && event.delta?.partial_json) {
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({
                    type: "tool_input_delta",
                    index: event.index,
                    partialJson: event.delta.partial_json,
                  })}\n\n`)
                );
              }

            } else if (event.type === "message_start") {
              const startData = {
                type: "start",
                model: event.message?.model,
                skill: skill ? { id: skill.id, name: skill.name } : null,
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
