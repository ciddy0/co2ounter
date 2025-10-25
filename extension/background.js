// Global State
let firebaseToken = null;
let promptCount = 0;
let totalInputTokens = 0;
let totalOutputTokens = 0;

// Load Firebase Token
chrome.storage.sync.get({ firebaseToken: null }, (data) => {
  firebaseToken = data.firebaseToken;
  console.log("🔑 Loaded Firebase token:", firebaseToken ? "YES" : "NO");
});

// Load local stats
chrome.storage.local.get(
  { promptCount: 0, totalInputTokens: 0, totalOutputTokens: 0 },
  (data) => {
    promptCount = data.promptCount;
    totalInputTokens = data.totalInputTokens;
    totalOutputTokens = data.totalOutputTokens;
    updateBadge(promptCount);
    console.log("📊 Loaded stats:", {
      promptCount,
      totalInputTokens,
      totalOutputTokens,
    });
  }
);

// Helpers
function updateBadge(count) {
  chrome.action.setBadgeText({ text: count.toString() });
  chrome.action.setBadgeBackgroundColor({ color: "#4caf50" });
}

function saveStats() {
  chrome.storage.local.set({
    promptCount,
    totalInputTokens,
    totalOutputTokens,
  });
  chrome.runtime.sendMessage({
    type: "STATS_UPDATED",
    stats: { promptCount, totalInputTokens, totalOutputTokens },
  });
  console.log("💾 Saved stats:", {
    promptCount,
    totalInputTokens,
    totalOutputTokens,
  });
}

async function syncWithBackend(endpoint, body) {
  if (!firebaseToken) {
    console.warn("⚠️ No Firebase token, skipping backend sync");
    return;
  }

  try {
    const res = await fetch("http://localhost:4000" + endpoint, {
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

// Message Handler
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Store Firebase TOken
  if (message.type === "STORE_TOKEN" && message.token) {
    firebaseToken = message.token;
    chrome.storage.sync.set({ firebaseToken }, () => {
      console.log("✅ Stored Firebase token in chrome.storage");
      sendResponse({ success: true });
    });
    return true; // keep async
  }

  // Prompt Sent
  if (message.type === "PROMPT_SENT") {
    console.log("📩 PROMPT_SENT received:", message);

    // Update Local Stats
    promptCount++;
    totalInputTokens += message.inputTokens || 0;
    updateBadge(promptCount);
    saveStats();

    // Sync to backend
    syncWithBackend("/api/prompt", {
      model: message.model || "chatgpt",
      inputTokens: message.inputTokens,
      co2: message.co2 || 0,
    });

    sendResponse({ received: true });
    return true;
  }

  // Get Stats
  if (message.type === "GET_STATS") {
    sendResponse({
      promptCount,
      totalInputTokens,
      totalOutputTokens,
    });
    return true;
  }

  // Response Tokens
  if (message.type === "RESPONSE_TOKENS") {
    console.log("📩 RESPONSE_TOKENS received:", message);

    // Update Local Stats
    totalOutputTokens += message.tokens || 0;
    saveStats();

    // Sync to Backend
    syncWithBackend("/api/response", {
      model: message.model || "Unknown",
      outputTokens: message.tokens,
      co2: message.co2 || 0,
    });

    sendResponse({ received: true });
    return true;
  }

  return false;
});
