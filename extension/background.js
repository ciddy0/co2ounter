// Global State
let firebaseToken = null;
let promptCount = 0;
let totalInputTokens = 0;
let totalOutputTokens = 0;

let totalCO2 = 0; // in grams

// carbon constants
const MODEL_PARAMS = {
  "gpt-5": 500, // estimated active params (billions)
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

function calculateCarbon(model, outputTokens) {
  const paramsB = MODEL_PARAMS[model] || 500;
  const energyKWh = ENERGY_PER_TOKEN * paramsB * outputTokens * PUE;
  const carbonKg = energyKWh * CARBON_INTENSITY;
  const carbonG = carbonKg * 1000; // convert to grams
  return carbonG;
}

// Load Firebase Token
chrome.storage.sync.get({ firebaseToken: null }, (data) => {
  firebaseToken = data.firebaseToken;
  console.log("🔑 Loaded Firebase token:", firebaseToken ? "YES" : "NO");
});

// Load local stats
chrome.storage.local.get(
  {
    promptCount: 0,
    totalInputTokens: 0,
    totalOutputTokens: 0,
    totalCO2: 0,
  },
  (data) => {
    promptCount = data.promptCount || 0;
    totalInputTokens = data.totalInputTokens || 0;
    totalOutputTokens = data.totalOutputTokens || 0;
    totalCO2 = data.totalCO2 || 0;
    updateBadge(promptCount);
    console.log("📊 Loaded stats:", {
      promptCount,
      totalInputTokens,
      totalOutputTokens,
      totalCO2,
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
    totalCO2,
  });
  chrome.runtime.sendMessage({
    type: "STATS_UPDATED",
    stats: { promptCount, totalInputTokens, totalOutputTokens, totalCO2 },
  });
  console.log("💾 Saved stats:", {
    promptCount,
    totalInputTokens,
    totalOutputTokens,
    totalCO2,
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
  console.log("📨 Received message:", message.type, message);

  if (message.type === "GET_STATS") {
    const stats = {
      promptCount,
      totalInputTokens,
      totalOutputTokens,
    };
    console.log("📤 Sending stats:", stats);
    sendResponse(stats);
    return true;
  } else if (message.type === "RESET_STATS") {
    promptCount = 0;
    totalInputTokens = 0;
    totalOutputTokens = 0;
    totalCO2 = 0;
    updateBadge(0);
    saveStats();
    sendResponse({ success: true });
    return true;
  } else if (message.type === "PROMPT_SENT") {
    // Received from content script when user sends a prompt
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
  } else if (message.type === "RESPONSE_TOKENS") {
    totalOutputTokens += message.tokens;
    saveStats();

    // calculate carbon
    const emission = calculateCarbon(message.model, message.tokens); // <— this is where it's called
    totalCO2 += emission;
    console.log(
      `📊 Output tokens: ${message.tokens} | Model: ${
        message.model
      } | Emission: ${emission.toFixed(4)}g CO₂`
    );

    console.log(`📊 Output tokens: ${message.tokens}`);

    notifyPopup({
      promptCount,
      totalInputTokens,
      totalOutputTokens,
    });

    sendResponse({ received: true });
    return true;
  }

  return false;
});
