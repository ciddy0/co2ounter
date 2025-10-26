// injected.js - runs in page context (ChatGPT + Claude support with model detection)
(function () {
  console.log("🔧 [INJECTED] Installing fetch interceptor...");

  // Simple token estimation
  function estimateTokens(text) {
    if (!text) return 0;
    const normalized = text.trim().replace(/\s+/g, " ");
    return Math.ceil(normalized.length / 4);
  }

  // Function to extract Claude model from the page DOM
  function getClaudeModelFromPage() {
    try {
      // Look for the model selector text (e.g., "Sonnet 4.5", "Opus 4")
      const modelElements = document.querySelectorAll(
        '[class*="whitespace-nowrap"]'
      );
      for (const el of modelElements) {
        const text = el.textContent.trim();
        if (text.match(/^(Sonnet|Opus|Haiku)/i)) {
          console.log("🤖 [INJECTED] Found Claude model in DOM:", text);
          return text;
        }
      }

      // Fallback: check button text or aria labels
      const buttons = document.querySelectorAll('button, [role="button"]');
      for (const btn of buttons) {
        const text = btn.textContent.trim();
        if (text.match(/^(Sonnet|Opus|Haiku)\s+[\d.]+/i)) {
          console.log("🤖 [INJECTED] Found Claude model in button:", text);
          return text;
        }
      }
    } catch (e) {
      console.warn("⚠️ [INJECTED] Could not extract model from DOM:", e);
    }
    return null;
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

        // DEBUG: Log the entire request body for Claude
        if (isClaudeInput) {
          console.log("🔍 [DEBUG] Full Claude request body:", requestData);
          console.log("🔍 [DEBUG] Request keys:", Object.keys(requestData));
        }

        let userText = "";
        let model = "unknown";

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

          // Extract ChatGPT model
          if (requestData.model) {
            model = requestData.model;
          }
        }

        // Claude format
        if (requestData.prompt) {
          userText = requestData.prompt;

          // For Claude, get model from the page DOM
          const pageModel = getClaudeModelFromPage();
          if (pageModel) {
            model = pageModel;
            console.log("🤖 [DEBUG] Using model from page:", model);
          }
        }

        // Also check URL for Claude model information
        if (isClaudeInput && url.includes("/completion")) {
          console.log("🔍 [DEBUG] Full URL:", url);
          // Sometimes model is in the URL path
          const urlMatch = url.match(
            /\/chat_conversations\/([^/]+)\/completion/
          );
          if (urlMatch) {
            console.log("🔍 [INJECTED] Claude conversation ID:", urlMatch[1]);
          }
        }

        if (userText) {
          const inputTokens = estimateTokens(userText);
          console.log("📥 [INJECTED] Input detected:", {
            inputTokens,
            model,
            preview: userText.substring(0, 100),
          });
          window.postMessage(
            {
              type: "TOKEN_COUNTER_INPUT",
              inputTokens,
              model,
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
      let detectedModel = "unknown";
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
                    model: detectedModel,
                    preview: fullText.substring(0, 100),
                  });
                  window.postMessage(
                    {
                      type: "TOKEN_COUNTER_OUTPUT",
                      tokens,
                      model: detectedModel,
                      text: fullText.substring(0, 100),
                    },
                    "*"
                  );
                }
                continue;
              }

              try {
                const parsed = JSON.parse(data);

                // DEBUG: Log all event types from Claude
                if (isClaudeOutput && parsed.type) {
                  console.log(
                    `🔍 [DEBUG] Claude event type: ${parsed.type}`,
                    parsed
                  );
                }

                // Extract model from response metadata
                if (parsed.model) {
                  detectedModel = parsed.model;
                }

                // ChatGPT: Extract model from various locations
                if (isChatGPTOutput) {
                  // Check metadata.model_slug (in delta events)
                  if (parsed.v?.message?.metadata?.model_slug) {
                    detectedModel = parsed.v.message.metadata.model_slug;
                    console.log(
                      "🤖 [INJECTED] ChatGPT model detected:",
                      detectedModel
                    );
                  }
                  // Check server metadata
                  if (
                    parsed.type === "server_ste_metadata" &&
                    parsed.metadata?.model_slug
                  ) {
                    detectedModel = parsed.metadata.model_slug;
                    console.log(
                      "🤖 [INJECTED] ChatGPT model detected from metadata:",
                      detectedModel
                    );
                  }
                }

                // Claude: Extract model from message_start event
                if (parsed.type === "message_start") {
                  console.log("🔍 [DEBUG] message_start event:", parsed);
                  if (parsed.message?.model && parsed.message.model !== "") {
                    detectedModel = parsed.message.model;
                    console.log(
                      "🤖 [INJECTED] Claude model detected from API:",
                      detectedModel
                    );
                  } else {
                    // Fallback to page model if API doesn't provide it
                    const pageModel = getClaudeModelFromPage();
                    if (pageModel) {
                      detectedModel = pageModel;
                      console.log(
                        "🤖 [INJECTED] Claude model detected from page:",
                        detectedModel
                      );
                    }
                  }
                }

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
                  }
                }

                // Handle Claude message_stop - send final count
                if (parsed.type === "message_stop" && fullText) {
                  const tokens = estimateTokens(fullText);
                  console.log(`✅ [INJECTED] ${platform} final output:`, {
                    tokens,
                    model: detectedModel,
                    preview: fullText.substring(0, 100),
                  });
                  window.postMessage(
                    {
                      type: "TOKEN_COUNTER_OUTPUT",
                      tokens,
                      model: detectedModel,
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
