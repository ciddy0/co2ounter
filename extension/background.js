// background.js
// Initialize counts from storage
let promptCount = 0;
let totalInputTokens = 0;
let totalOutputTokens = 0;

chrome.storage.local.get(
  {
    promptCount: 0,
    totalInputTokens: 0,
    totalOutputTokens: 0,
  },
  (data) => {
    promptCount = data.promptCount || 0;
    totalInputTokens = data.totalInputTokens || 0;
    totalOutputTokens = data.totalOutputTokens || 0;
    updateBadge(promptCount);
    console.log("📊 Loaded stats:", {
      promptCount,
      totalInputTokens,
      totalOutputTokens,
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
  });
  console.log("💾 Saved stats:", {
    promptCount,
    totalInputTokens,
    totalOutputTokens,
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
    };
    console.log("📤 Sending stats:", stats);
    sendResponse(stats);
    return true;
  } else if (message.type === "RESET_STATS") {
    promptCount = 0;
    totalInputTokens = 0;
    totalOutputTokens = 0;
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
    saveStats();

    console.log(`📊 Output tokens: ${message.tokens}`);

    notifyPopup({
      promptCount,
      totalInputTokens,
      totalOutputTokens,
    });

    sendResponse({ success: true });
    return true;
  }

  return true;
});
