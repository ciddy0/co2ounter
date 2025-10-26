// content.js
console.log("📡 Content script loaded on:", window.location.href);

const messageQueue = [];
let sending = false;
const SEND_INTERVAL = 100; // ms

function processQueue() {
  if (sending || messageQueue.length === 0) return;
  sending = true;
  const msg = messageQueue.shift();
  chrome.runtime.sendMessage(msg, (response) => {
    sending = false;
    if (chrome.runtime.lastError) {
      console.warn("❌ Failed to send message, re-queueing", msg);
      messageQueue.unshift(msg);
    } else {
      console.log("✅ Message sent successfully:", msg.type);
    }
    setTimeout(processQueue, SEND_INTERVAL);
  });
}

// Only inject the script for LLM sites (not your localhost app)
const isLLMSite =
  window.location.hostname.includes("openai.com") ||
  window.location.hostname.includes("chatgpt.com") ||
  window.location.hostname.includes("claude.ai");

if (isLLMSite) {
  const script = document.createElement("script");
  script.src = chrome.runtime.getURL("injected.js");
  script.onload = function () {
    console.log("✅ Injected script loaded");
    this.remove();
  };
  (document.head || document.documentElement).appendChild(script);
}

// Listen for messages from the page
window.addEventListener("message", (event) => {
  if (event.source !== window) return;

  console.log("📬 Content script received message:", event.data.type);

  // ⭐ ADD THIS: Handle Firebase token from login page
  if (event.data.type === "FIREBASE_TOKEN") {
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

  // Handle token counter input
  if (event.data.type === "TOKEN_COUNTER_INPUT") {
    console.log("📨 Received input tokens:", event.data);
    messageQueue.push({
      type: "PROMPT_SENT",
      inputTokens: event.data.inputTokens,
      text: event.data.text,
    });
    processQueue();
  }

  // Handle token counter output
  if (event.data.type === "TOKEN_COUNTER_OUTPUT") {
    console.log("📨 Received output tokens:", event.data);
    messageQueue.push({
      type: "RESPONSE_TOKENS",
      tokens: event.data.tokens,
      model: event.data.model,
      text: event.data.text,
    });
    processQueue();
  }
});

console.log("👂 Content script ready and listening...");
