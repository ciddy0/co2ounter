let firebaseToken = null;

// Load token at startup
chrome.storage.sync.get({ firebaseToken: null }, (data) => {
  firebaseToken = data.firebaseToken;
  console.log("🔑 Loaded Firebase token:", firebaseToken ? "YES" : "NO");
});

//  Backend Sync Helper
async function syncWithBackend(endpoint, body) {
  if (!firebaseToken) {
    console.warn("⚠️ No Firebase token, skipping backend sync");
    return;
  }

  try {
    const res = await fetch("http://localhost:4000" + endpoint, {
      // change to your prod backend later
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${firebaseToken}`,
      },
      body: JSON.stringify(body),
    });

    const json = await res.json();
    console.log("☁️ Backend sync result:", endpoint, json);
    return json;
  } catch (err) {
    console.error("❌ Backend sync failed:", err);
  }
}

//  Message Handler
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Store Firebase Token
  if (message.type === "STORE_TOKEN" && message.token) {
    firebaseToken = message.token;
    chrome.storage.sync.set({ firebaseToken: message.token }, () => {
      console.log("✅ Stored Firebase token in chrome.storage");
      sendResponse({ success: true });
    });
    return true; // async sendResponse
  }

  // Prompt Sent
  if (message.type === "PROMPT_SENT") {
    console.log("📩 PROMPT_SENT received:", message);

    syncWithBackend("/api/prompt", {
      model: message.model || "chatgpt",
      inputTokens: message.inputTokens,
      co2: message.co2 || 0.0,
    });

    sendResponse({ received: true });
    return true;
  }

  // Response Tokens
  if (message.type === "RESPONSE_TOKENS") {
    console.log("📩 RESPONSE_TOKENS received:", message);

    syncWithBackend("/api/response", {
      model: message.model || "chatgpt",
      outputTokens: message.tokens,
      co2: message.co2 || 0.0,
    });

    sendResponse({ received: true });
    return true;
  }

  return false;
});
