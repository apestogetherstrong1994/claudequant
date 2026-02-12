// Custom hook for streaming Claude responses via our API route
// Handles SSE parsing, message accumulation, and loading states

import { useState, useCallback, useRef } from "react";

export function useChatStream() {
  const [messages, setMessages] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef(null);

  // Send a message and stream the response
  const sendMessage = useCallback(async (userText, dataContext = null) => {
    if (!userText.trim() || isStreaming) return;

    // Add user message to history
    const userMsg = { role: "user", content: userText };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);

    // Prepare assistant placeholder
    setMessages((prev) => [...prev, { role: "assistant", content: "", isStreaming: true }]);
    setIsStreaming(true);

    // Abort controller for cancellation
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          dataContext,
        }),
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
        buffer = lines.pop() || ""; // keep incomplete line in buffer

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice(6).trim();
          if (payload === "[DONE]") break;

          try {
            const data = JSON.parse(payload);
            if (data.type === "text") {
              fullText += data.text;
              // Update the last (assistant) message with accumulated text
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                  role: "assistant",
                  content: fullText,
                  isStreaming: true,
                };
                return updated;
              });
            } else if (data.type === "error") {
              throw new Error(data.error);
            }
          } catch (parseErr) {
            // Skip non-JSON lines
            if (parseErr instanceof SyntaxError) continue;
            throw parseErr;
          }
        }
      }

      // Finalize — remove streaming flag
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          content: fullText,
          isStreaming: false,
        };
        return updated;
      });
    } catch (err) {
      if (err.name === "AbortError") {
        // User cancelled — keep partial text
        setMessages((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last?.role === "assistant") {
            updated[updated.length - 1] = { ...last, isStreaming: false, cancelled: true };
          }
          return updated;
        });
      } else {
        // Real error — show it
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "assistant",
            content: `Something went wrong: ${err.message}. Please try again.`,
            isStreaming: false,
            isError: true,
          };
          return updated;
        });
      }
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  }, [messages, isStreaming]);

  // Stop streaming
  const stopStreaming = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  // Reset conversation
  const resetMessages = useCallback(() => {
    setMessages([]);
    setIsStreaming(false);
    abortRef.current?.abort();
  }, []);

  // Replace messages (e.g., for loading initial analysis)
  const setMessagesDirectly = useCallback((msgs) => {
    setMessages(msgs);
  }, []);

  return {
    messages,
    isStreaming,
    sendMessage,
    stopStreaming,
    resetMessages,
    setMessages: setMessagesDirectly,
  };
}
