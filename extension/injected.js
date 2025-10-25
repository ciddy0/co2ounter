// injected.js - runs in page context (ChatGPT + Claude support)
(function () {
  console.log("🔧 [INJECTED] Installing fetch interceptor...");

  // Simple token estimation
  function estimateTokens(text) {
    if (!text) return 0;
    const normalized = text.trim().replace(/\s+/g, " ");
    return Math.ceil(normalized.length / 4);
  }

  // Save original fetch
  const originalFetch = window.fetch;

  // Override fetch
  window.fetch = async function (...args) {
    const url = typeof args[0] === "string" ? args[0] : args[0]?.url;
    const options = args[1] || {};

    // Detect ChatGPT input requests
    const isChatGPTInput =
      url &&
      (url.includes("backend-api/conversation") ||
        url.includes("backend-api/f/conversation") ||
        url.includes("/backend-api/v2/conversation") ||
        url.includes("api/conversation")) &&
      !url.includes("/prepare") &&
      !url.includes("/stream_status") &&
      !url.includes("/experimental/") &&
      !url.includes("/autocompletions");

    // Detect Claude input requests
    const isClaudeInput =
      url &&
      url.includes("claude.ai/api/organizations") &&
      url.includes("/completion");

    if (
      (isChatGPTInput || isClaudeInput) &&
      options.method === "POST" &&
      options.body
    ) {
      try {
        const bodyText =
          typeof options.body === "string"
            ? options.body
            : JSON.stringify(options.body);
        const requestData = JSON.parse(bodyText);

        let userText = "";

        // ChatGPT format
        if (requestData.messages && Array.isArray(requestData.messages)) {
          const userMessages = requestData.messages.filter(
            (msg) => msg.role === "user" || msg.author?.role === "user"
          );

          if (userMessages.length > 0) {
            const lastMessage = userMessages[userMessages.length - 1];

            if (typeof lastMessage.content === "string")
              userText = lastMessage.content;
            else if (lastMessage.content?.parts)
              userText = lastMessage.content.parts.join(" ");
          }
        }

        // Claude format
        if (requestData.prompt) {
          userText = requestData.prompt;
        }

        if (userText) {
          const inputTokens = estimateTokens(userText);
          console.log("📥 [INJECTED] Input detected:", {
            inputTokens,
            preview: userText.substring(0, 100),
          });
          window.postMessage(
            {
              type: "TOKEN_COUNTER_INPUT",
              inputTokens,
              text: userText.substring(0, 100),
            },
            "*"
          );
        }
      } catch (e) {
        console.error("❌ [INJECTED] Error parsing input body:", e);
      }
    }

    // Perform the actual fetch
    const response = await originalFetch.apply(this, args);

    // Detect ChatGPT streaming responses
    const isChatGPTOutput =
      url &&
      (url.includes("backend-api/conversation") ||
        url.includes("backend-api/f/conversation") ||
        url.includes("ces/v1/t")) &&
      !url.includes("/prepare") &&
      !url.includes("/stream_status") &&
      !url.includes("/experimental/") &&
      !url.includes("/autocompletions");

    // Detect Claude streaming responses
    const isClaudeOutput =
      url &&
      url.includes("claude.ai/api/organizations") &&
      url.includes("/completion");

    if ((isChatGPTOutput || isClaudeOutput) && response.body) {
      const clonedResponse = response.clone();
      const reader = clonedResponse.body.getReader();
      const decoder = new TextDecoder();
      let fullText = "";
      let buffer = "";
      const platform = isClaudeOutput ? "Claude" : "ChatGPT";

      (async () => {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              const trimmed = line.trim();

              // Handle event lines
              if (trimmed.startsWith("event:")) {
                continue;
              }

              // Handle data lines
              if (!trimmed.startsWith("data:")) continue;
              const data = trimmed.substring(5).trim();

              if (data === "[DONE]") {
                if (fullText) {
                  const tokens = estimateTokens(fullText);
                  console.log(`✅ [INJECTED] ${platform} final output:`, {
                    tokens,
                    preview: fullText.substring(0, 100),
                  });
                  window.postMessage(
                    {
                      type: "TOKEN_COUNTER_OUTPUT",
                      tokens,
                      text: fullText.substring(0, 100),
                    },
                    "*"
                  );
                }
                continue;
              }

              try {
                const parsed = JSON.parse(data);

                // === CHATGPT FORMAT ===
                // Handle ChatGPT's delta format with JSON Patch operations
                if (parsed.v && Array.isArray(parsed.v)) {
                  for (const operation of parsed.v) {
                    if (
                      operation.o === "append" &&
                      operation.p &&
                      operation.p.includes("/message/content/parts/") &&
                      operation.v
                    ) {
                      fullText += operation.v;
                    }
                  }
                }

                // Handle initial message creation with content
                if (
                  parsed.v?.message?.content?.parts &&
                  Array.isArray(parsed.v.message.content.parts)
                ) {
                  const parts = parsed.v.message.content.parts;
                  if (
                    parts.length > 0 &&
                    parts[0] &&
                    parts[0].length > 0 &&
                    fullText === ""
                  ) {
                    fullText = parts[0];
                  }
                }

                // Fallback: Handle standard OpenAI format
                if (parsed.delta?.content) {
                  fullText += parsed.delta.content;
                } else if (parsed.choices?.[0]?.delta?.content) {
                  fullText += parsed.choices[0].delta.content;
                }

                // === CLAUDE FORMAT ===
                // Handle Claude's content_block_delta events
                if (parsed.type === "content_block_delta" && parsed.delta) {
                  // Regular text (not in artifacts)
                  if (parsed.delta.type === "text_delta" && parsed.delta.text) {
                    fullText += parsed.delta.text;
                  }

                  // Artifact content (JSON that contains the actual code/content)
                  if (
                    parsed.delta.type === "input_json_delta" &&
                    parsed.delta.partial_json
                  ) {
                    // Don't add raw JSON to fullText - it's tool input, not the response
                    // We only want user-visible text
                  }
                }

                // Handle Claude message_stop - send final count
                if (parsed.type === "message_stop" && fullText) {
                  const tokens = estimateTokens(fullText);
                  console.log(`✅ [INJECTED] ${platform} final output:`, {
                    tokens,
                    preview: fullText.substring(0, 100),
                  });
                  window.postMessage(
                    {
                      type: "TOKEN_COUNTER_OUTPUT",
                      tokens,
                      text: fullText.substring(0, 100),
                    },
                    "*"
                  );
                  fullText = ""; // Reset for next message
                }
              } catch (e) {
                // ignore non-JSON lines
              }
            }
          }
        } catch (err) {
          console.error("❌ [INJECTED] Error reading output stream:", err);
        }
      })();
    }

    return response;
  };

  console.log(
    "🚀 [INJECTED] Token Counter: Fetch interceptor active (ChatGPT + Claude)"
  );
})();
