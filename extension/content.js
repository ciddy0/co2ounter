// content.js - Bridge between injected.js and background.js
console.log("📡 Content script loaded on:", window.location.href);

const messageQueue = [];
let sending = false;
const SEND_INTERVAL = 100; // ms

function processQueue() {
  if (sending || messageQueue.length === 0) return;
  sending = true;
  const msg = messageQueue.shift();

  console.log("🚀 Processing message from queue:", msg);

  chrome.runtime.sendMessage(msg, (response) => {
    sending = false;
    if (chrome.runtime.lastError) {
      console.warn(
        "❌ Failed to send message, re-queueing",
        msg,
        chrome.runtime.lastError
      );
      messageQueue.unshift(msg);
    } else {
      console.log("✅ Message sent to background:", msg.type);
    }
    setTimeout(processQueue, SEND_INTERVAL);
  });
}

// Detect which AI platform we're on
const hostname = window.location.hostname;
const isChatGPT =
  hostname.includes("openai.com") || hostname.includes("chatgpt.com");
const isClaude = hostname.includes("claude.ai");
const isGemini = hostname.includes("gemini.google.com");
const isLLMSite = isChatGPT || isClaude || isGemini;

console.log(`🤖 Platform detected: ${hostname}`);

// Only inject the script for ChatGPT and Claude (injected.js handles both)
if (isChatGPT || isClaude) {
  const script = document.createElement("script");
  script.src = chrome.runtime.getURL("injected.js");
  script.onload = function () {
    console.log("✅ Injected script loaded");
    this.remove();
  };
  (document.head || document.documentElement).appendChild(script);
  console.log(
    "💉 Injecting fetch interceptor for",
    isChatGPT ? "ChatGPT" : "Claude"
  );
}

// ==================== GEMINI TRACKER (No injected.js support yet) ====================
if (isGemini) {
  console.log("🔵 Gemini tracker initialized");

  const originalFetch = window.fetch;
  window.fetch = async function (...args) {
    const [url, options] = args;

    if (
      url.includes("generativelanguage.googleapis.com") &&
      options?.method === "POST"
    ) {
      console.log("🔍 Gemini API call detected");

      try {
        const body = JSON.parse(options.body);

        if (body.contents) {
          let totalText = "";
          body.contents.forEach((content) => {
            content.parts?.forEach((part) => {
              if (part.text) totalText += part.text;
            });
          });

          const inputTokens = Math.ceil(totalText.length / 4);

          console.log("📤 Gemini prompt:", {
            preview: totalText.substring(0, 50) + "...",
            inputTokens,
          });

          messageQueue.push({
            type: "PROMPT_SENT",
            model: "gemini",
            inputTokens: inputTokens,
          });
          processQueue();
        }
      } catch (err) {
        console.error("❌ Error parsing Gemini request:", err);
      }
    }

    const response = await originalFetch.apply(this, args);

    if (
      url.includes("generativelanguage.googleapis.com") &&
      options?.method === "POST"
    ) {
      return response
        .clone()
        .json()
        .then((data) => {
          try {
            if (data.usageMetadata?.candidatesTokenCount) {
              const outputTokens = data.usageMetadata.candidatesTokenCount;

              console.log("📥 Gemini response tokens:", outputTokens);

              messageQueue.push({
                type: "RESPONSE_TOKENS",
                model: "gemini",
                tokens: outputTokens,
              });
              processQueue();
            } else if (data.candidates) {
              let totalText = "";
              data.candidates.forEach((candidate) => {
                candidate.content?.parts?.forEach((part) => {
                  if (part.text) totalText += part.text;
                });
              });

              const outputTokens = Math.ceil(totalText.length / 4);

              console.log(
                "📥 Gemini response tokens (estimated):",
                outputTokens
              );

              messageQueue.push({
                type: "RESPONSE_TOKENS",
                model: "gemini",
                tokens: outputTokens,
              });
              processQueue();
            }
          } catch (err) {
            console.error("❌ Error parsing Gemini response:", err);
          }

          return new Response(JSON.stringify(data), {
            status: response.status,
            statusText: response.statusText,
            headers: response.headers,
          });
        });
    }

    return response;
  };
}

// ==================== LISTEN FOR MESSAGES FROM INJECTED.JS ====================
window.addEventListener("message", (event) => {
  if (event.source !== window) return;

  const { type, inputTokens, tokens, model, text } = event.data;

  console.log("📬 Content script received message:", type);

  // Handle Firebase token from login page
  if (type === "FIREBASE_TOKEN") {
    console.log("🔑 Firebase token received! Forwarding to background...");
    chrome.runtime.sendMessage(
      {
        type: "STORE_TOKEN",
        token: event.data.token,
      },
      (response) => {
        if (chrome.runtime.lastError) {
          console.error(
            "❌ Failed to store token:",
            chrome.runtime.lastError.message
          );
        } else {
          console.log("✅ Token stored successfully:", response);
        }
      }
    );
    return;
  }

  // Handle input tokens from injected.js
  if (type === "TOKEN_COUNTER_INPUT") {
    console.log("📨 Received input tokens:", {
      inputTokens,
      model,
      preview: text,
    });

    // Map model names to our backend format
    let mappedModel = "chatgpt"; // default
    if (model) {
      const modelLower = model.toLowerCase();
      if (
        modelLower.includes("claude") ||
        modelLower.includes("sonnet") ||
        modelLower.includes("opus") ||
        modelLower.includes("haiku")
      ) {
        mappedModel = "claude";
      } else if (modelLower.includes("gemini")) {
        mappedModel = "gemini";
      } else if (modelLower.includes("gpt")) {
        mappedModel = "chatgpt";
      }
    }

    messageQueue.push({
      type: "PROMPT_SENT",
      model: mappedModel,
      inputTokens: inputTokens || 0,
    });
    processQueue();
  }

  // Handle output tokens from injected.js
  if (type === "TOKEN_COUNTER_OUTPUT") {
    console.log("📨 Received output tokens:", { tokens, model, preview: text });

    // Map model names to our backend format
    let mappedModel = "chatgpt"; // default
    if (model) {
      const modelLower = model.toLowerCase();
      if (
        modelLower.includes("claude") ||
        modelLower.includes("sonnet") ||
        modelLower.includes("opus") ||
        modelLower.includes("haiku")
      ) {
        mappedModel = "claude";
      } else if (modelLower.includes("gemini")) {
        mappedModel = "gemini";
      } else if (modelLower.includes("gpt")) {
        mappedModel = "chatgpt";
      }
    }

    messageQueue.push({
      type: "RESPONSE_TOKENS",
      model: mappedModel,
      tokens: tokens || 0,
    });
    processQueue();
  }
});

console.log("👂 Content script ready and listening...");
