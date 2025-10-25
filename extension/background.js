// Global State
let firebaseToken = null;
let promptCount = 0;
let totalInputTokens = 0;
let totalOutputTokens = 0;
let totalCO2 = 0; // grams

// Carbon calculation constants
const MODEL_PARAMS = {
  "gpt-5": 500,
  "gpt-4o": 500,
  "gpt-4": 1200,
  "gpt-3.5": 175,
  "claude-3-opus": 500,
  "claude-3-sonnet": 200,
  "claude-3-haiku": 30,
};
const PUE = 1.2;
const CARBON_INTENSITY = 0.379; // kg CO2 / kWh
const ENERGY_PER_TOKEN = 7.594e-9; // kWh per token per billion params

function calculateCarbon(model, tokens) {
  const paramsB = MODEL_PARAMS[model] || 500;
  const energyKWh = ENERGY_PER_TOKEN * paramsB * tokens * PUE;
  const carbonKg = energyKWh * CARBON_INTENSITY;
  return carbonKg * 1000; // grams
}

// Increment stats + update badge + notify popup
function incrementStats({ inputTokens = 0, outputTokens = 0, co2 = 0 }) {
  if (inputTokens) {
    promptCount++;
    totalInputTokens += inputTokens;
  }
  if (outputTokens) {
    totalOutputTokens += outputTokens;
  }
  if (co2) {
    totalCO2 += co2;
  }

  // Save to local storage
  chrome.storage.local.set(
    { promptCount, totalInputTokens, totalOutputTokens, totalCO2 },
    () => {
      console.log("💾 Stats saved", {
        promptCount,
        totalInputTokens,
        totalOutputTokens,
        totalCO2,
      });
    }
  );

  // Update badge
  chrome.action.setBadgeText({ text: promptCount.toString() });
  chrome.action.setBadgeBackgroundColor({ color: "#4caf50" });

  // Notify popup
  chrome.runtime.sendMessage({
    type: "STATS_UPDATED",
    stats: { promptCount, totalInputTokens, totalOutputTokens, totalCO2 },
  });
}

// Load Firebase token and local stats on startup
chrome.storage.sync.get({ firebaseToken: null }, (data) => {
  firebaseToken = data.firebaseToken;
  console.log("🔑 Loaded Firebase token:", firebaseToken ? "YES" : "NO");
});

chrome.storage.local.get(
  { promptCount: 0, totalInputTokens: 0, totalOutputTokens: 0, totalCO2: 0 },
  (data) => {
    promptCount = data.promptCount;
    totalInputTokens = data.totalInputTokens;
    totalOutputTokens = data.totalOutputTokens;
    totalCO2 = data.totalCO2;
    chrome.action.setBadgeText({ text: promptCount.toString() });
    console.log("📊 Loaded stats:", {
      promptCount,
      totalInputTokens,
      totalOutputTokens,
      totalCO2,
    });
  }
);

// Backend sync helper
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

// Main message handler
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("📨 Received message:", message.type, message);

  if (message.type === "STORE_TOKEN" && message.token) {
    firebaseToken = message.token;
    chrome.storage.sync.set({ firebaseToken }, () => {
      console.log("✅ Stored Firebase token in chrome.storage");
      sendResponse({ success: true });
    });
    return true; // async sendResponse
  }

  if (message.type === "PROMPT_SENT") {
    incrementStats({ inputTokens: message.inputTokens });
    syncWithBackend("/api/prompt", {
      model: message.model || "chatgpt",
      inputTokens: message.inputTokens,
      co2: message.co2 || 0,
    });
    sendResponse({ received: true });
    return true;
  }

  if (message.type === "RESPONSE_TOKENS") {
    const co2 = calculateCarbon(message.model, message.tokens);
    incrementStats({ outputTokens: message.tokens, co2 });
    syncWithBackend("/api/response", {
      model: message.model || "chatgpt",
      outputTokens: message.tokens,
      co2,
    });
    sendResponse({ received: true });
    return true;
  }

  if (message.type === "GET_STATS") {
    sendResponse({
      promptCount,
      totalInputTokens,
      totalOutputTokens,
      totalCO2,
    });
    return true;
  }

  if (message.type === "RESET_STATS") {
    promptCount = totalInputTokens = totalOutputTokens = totalCO2 = 0;
    incrementStats({}); // triggers badge + storage + popup
    sendResponse({ success: true });
    return true;
  }

  return false;
});
