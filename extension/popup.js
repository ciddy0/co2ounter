// popup.js
const countEl = document.getElementById("count");

function updateCount(count) {
  countEl.innerText = count;
}

// Ask background for current count when popup opens
chrome.runtime.sendMessage({ type: "GET_PROMPT_COUNT" }, (response) => {
  updateCount(response.count);
});

// Listen for live updates
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "PROMPT_COUNT_UPDATED") {
    updateCount(message.count);
  }
});
