// background.js
// Initalize prompt count from storage
let promptCount = 0;
chrome.storage.local.get({ promptCount: 0 }, (data) => {
  promptCount = data.promptCount || 0;
  updateBadge(promptCount);
});

// function to update badge
function updateBadge(count) {
  chrome.action.setBadgeText({ text: count.toString() });
  chrome.action.setBadgeBackgroundColor({ color: "#4caf50" });
}

// function to notify popup
function notifyPopup(count) {
  chrome.runtime.sendMessage({ type: "PROMPT_COUNT_UPDATED", count }, () => {
    if (chrome.runtime.lastError) {
      // popup not open
    }
  });
}

// Handle messages
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "PROMPT_SENT") {
    promptCount++;
    updateBadge(promptCount);
    chrome.storage.local.set({ promptCount });
    notifyPopup(promptCount);
    sendResponse({ success: true });
  } else if (message.type === "GET_PROMPT_COUNT") {
    sendResponse({ count: promptCount });
  }
  return true;
});

// Try multiple URL patterns to catch ChatGPT requests
chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    console.log("🔍 Request detected:", details.url, details.method);
    if (details.method === "POST") {
      promptCount++;
      updateBadge(promptCount);
      chrome.storage.local.set({ promptCount });
      notifyPopup(promptCount);
    }
  },
  {
    urls: [
      // ChatGPT
      "https://chatgpt.com/backend-api/conversation",
      "https://chatgpt.com/backend-api/*/conversation",
      "https://chat.openai.com/backend-api/conversation",
      "https://chat.openai.com/backend-api/*/conversation",
      // Claude
      "https://claude.ai/api/organizations/*/chat_conversations/*/completion",
    ],
  }
);
