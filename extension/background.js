// background.js - Updated to sync with Firebase only
let firebaseToken = null;
let isLoggedIn = false;

const BACKEND_URL = "http://localhost:4000";

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

// Load Firebase token on startup
chrome.storage.sync.get({ firebaseToken: null }, (data) => {
  firebaseToken = data.firebaseToken;
  isLoggedIn = !!firebaseToken;
  console.log("🔑 Loaded Firebase token:", firebaseToken ? "YES" : "NO");
  updatePopup();
  if (isLoggedIn) {
    updateBadgeFromFirebase(); // Load initial badge count
  }
});

// Backend sync helper
async function syncWithBackend(endpoint, body) {
  if (!firebaseToken) {
    console.warn("⚠️ No Firebase token, skipping backend sync");
    return null;
  }
  try {
    const res = await fetch(BACKEND_URL + endpoint, {
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
    return null;
  }
}

// Fetch stats from backend
async function fetchStatsFromBackend() {
  if (!firebaseToken) {
    return null;
  }
  try {
    const res = await fetch(`${BACKEND_URL}/api/stats`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${firebaseToken}`,
      },
    });
    const json = await res.json();
    return json;
  } catch (err) {
    console.error("❌ Failed to fetch stats:", err);
    return null;
  }
}

// Update badge from Firebase data
async function updateBadgeFromFirebase() {
  const stats = await fetchStatsFromBackend();
  if (stats && stats.success) {
    const count = stats.today.promptCount || 0;
    const userLimit = stats.user.dailyLimitPrompts || 50;

    let badgeText =
      count > userLimit
        ? count > 999
          ? "999!+"
          : count.toString() + "!"
        : count.toString();

    chrome.action.setBadgeText({ text: badgeText });

    // Determine badge color based on count
    let color = "#B2FBA5"; // light green
    if (count >= 50) {
      color = "#AA4A44"; // red
    } else if (count >= 30) {
      color = "#E49B0F"; // orange
    } else if (count >= 20) {
      color = "#FDDA0D"; // yellow
    }

    chrome.action.setBadgeBackgroundColor({ color });
    console.log("🔖 Badge updated:", count, "Color:", color);
  } else {
    // Clear badge if no stats available
    chrome.action.setBadgeText({ text: "" });
  }
}

// Notify popup to refresh
function notifyPopup() {
  chrome.runtime
    .sendMessage({
      type: "STATS_UPDATED",
    })
    .catch(() => {
      // Popup might not be open, that's ok
      console.log("Popup not open, skipping notification");
    });
}

// Main message handler
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("📨 Received message:", message.type, message);

  if (message.type === "STORE_TOKEN" && message.token) {
    firebaseToken = message.token;
    isLoggedIn = true;
    chrome.storage.sync.set({ firebaseToken }, () => {
      console.log("✅ Stored Firebase token in chrome.storage");
      updatePopup();
      updateBadgeFromFirebase();
      sendResponse({ success: true });
    });
    return true; // async sendResponse
  }

  if (message.type === "LOGOUT") {
    console.log("🚪 Logging out user...");

    // Clear state immediately
    firebaseToken = null;
    isLoggedIn = false;

    // Clear badge immediately
    chrome.action.setBadgeText({ text: "" });

    // Update popup path BEFORE clearing storage
    chrome.action.setPopup({ popup: "welcome-popup.html" });
    console.log("🔄 Popup path updated to welcome-popup.html");

    // Then clear storage
    chrome.storage.sync.remove("firebaseToken", () => {
      console.log("✅ Token removed from storage");
      console.log("🎉 Logout complete!");

      // Send success response
      sendResponse({ success: true });
    });

    return true; // async sendResponse
  }

  if (message.type === "PROMPT_SENT") {
    const co2 = calculateCarbon(
      message.model || "chatgpt",
      message.inputTokens || 0
    );
    syncWithBackend("/api/prompt", {
      model: message.model || "chatgpt",
      inputTokens: message.inputTokens || 0,
      co2: co2,
    }).then(() => {
      updateBadgeFromFirebase();
      notifyPopup();
    });
    sendResponse({ received: true });
    return true;
  }

  if (message.type === "RESPONSE_TOKENS") {
    const co2 = calculateCarbon(message.model, message.tokens);
    syncWithBackend("/api/response", {
      model: message.model || "chatgpt",
      outputTokens: message.tokens,
      co2,
    }).then(() => {
      notifyPopup();
    });
    sendResponse({ received: true });
    return true;
  }

  if (message.type === "GET_STATS") {
    // Return Firebase stats instead of local
    fetchStatsFromBackend().then((data) => {
      if (data && data.success) {
        sendResponse({
          promptCount: data.today.promptCount || 0,
          totalInputTokens: 0, // Not tracked separately in today's data
          totalOutputTokens: data.today.outputTokens || 0,
          totalCO2: data.today.co2Total || 0,
        });
      } else {
        sendResponse({
          promptCount: 0,
          totalInputTokens: 0,
          totalOutputTokens: 0,
          totalCO2: 0,
        });
      }
    });
    return true;
  }

  if (message.type === "RESET_STATS") {
    // Note: Backend doesn't have a reset endpoint
    // You could implement one or just refresh the display
    console.log("⚠️ Reset not implemented on backend");
    sendResponse({ success: false, error: "Reset not available" });
    return true;
  }

  return false;
});

// Update popup based on auth state
function updatePopup() {
  const popupPath = isLoggedIn ? "content-popup.html" : "welcome-popup.html";
  chrome.action.setPopup({ popup: popupPath });
  console.log("🔄 Popup updated to:", popupPath);
}

// Refresh badge periodically (every 5 minutes) - only if logged in
setInterval(() => {
  if (isLoggedIn && firebaseToken) {
    updateBadgeFromFirebase();
  }
}, 5 * 60 * 1000);
