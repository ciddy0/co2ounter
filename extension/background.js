// background.js
// Initialize counts from storage
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

function updateBadge(count) {
  chrome.action.setBadgeText({ text: count.toString() });
  chrome.action.setBadgeBackgroundColor({ color: "#4caf50" });
}

function notifyPopup(data) {
  chrome.runtime.sendMessage(
    {
      type: "STATS_UPDATED",
      ...data,
    },
    () => {
      if (chrome.runtime.lastError) {
        // Popup not open, this is expected
      }
    }
  );
}

function saveStats() {
  chrome.storage.local.set({
    promptCount,
    totalInputTokens,
    totalOutputTokens,
    totalCO2,
  });
  console.log("💾 Saved stats:", {
    promptCount,
    totalInputTokens,
    totalOutputTokens,
    totalCO2,
  });
}

// CONSOLIDATED message handler - handles ALL message types
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("📨 Received message:", message.type, message);

  if (message.type === "GET_STATS") {
    const stats = {
      promptCount,
      totalInputTokens,
      totalOutputTokens,
      totalCO2,
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

    console.log(
      `📊 Input tokens: ${message.inputTokens}, Total prompts: ${promptCount}`
    );

    notifyPopup({
      promptCount,
      totalInputTokens,
      totalOutputTokens,
    });

    sendResponse({ success: true });
    return true;
  } else if (message.type === "RESPONSE_TOKENS") {
    totalOutputTokens += message.tokens;

    // calculate carbon
    const emission = calculateCarbon(message.model, message.tokens); // <— this is where it's called
    totalCO2 += emission;
    console.log(
      `📊 Output tokens: ${message.tokens} | Model: ${
        message.model
      } | Emission: ${emission.toFixed(4)}g CO₂`
    );
    saveStats();

    notifyPopup({
      promptCount,
      totalInputTokens,
      totalOutputTokens,
      totalCO2,
    });

    sendResponse({ success: true });
    return true;
  }

  return true;
});
