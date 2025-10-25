// content.js
console.log("📡 Content script loaded");

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
    }
    setTimeout(processQueue, SEND_INTERVAL);
  });
}

// Inject the script into page context
const script = document.createElement("script");
script.src = chrome.runtime.getURL("injected.js");
script.onload = function () {
  console.log("✅ Injected script loaded");
  this.remove();
};
(document.head || document.documentElement).appendChild(script);

// Listen for messages from the injected script
window.addEventListener("message", (event) => {
  if (event.source !== window) return;

  if (event.data.type === "TOKEN_COUNTER_INPUT") {
    console.log("📨 Received input tokens:", event.data);
    messageQueue.push({
      type: "PROMPT_SENT",
      inputTokens: event.data.inputTokens,
      text: event.data.text,
    });
    processQueue();
  }

  if (event.data.type === "TOKEN_COUNTER_OUTPUT") {
    console.log("📨 Received output tokens:", event.data);
    messageQueue.push({
      type: "RESPONSE_TOKENS",
      tokens: event.data.tokens,
      text: event.data.text,
    });
    processQueue();
  }
});
