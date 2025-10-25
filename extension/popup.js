// popup.js
// Wait for DOM to be ready
document.addEventListener("DOMContentLoaded", function () {
  const countEl = document.getElementById("count");
  const inputTokensEl = document.getElementById("inputTokens");
  const outputTokensEl = document.getElementById("outputTokens");
  const totalTokensEl = document.getElementById("totalTokens");
  const co2El = document.getElementById("co2");

  function updateStats(stats) {
    if (countEl) {
      countEl.innerText = (stats.promptCount || 0).toLocaleString();
    }

    if (inputTokensEl) {
      inputTokensEl.innerText = (stats.totalInputTokens || 0).toLocaleString();
    }

    if (outputTokensEl) {
      outputTokensEl.innerText = (
        stats.totalOutputTokens || 0
      ).toLocaleString();
    }

    if (totalTokensEl) {
      const totalTokens =
        (stats.totalInputTokens || 0) + (stats.totalOutputTokens || 0);
      totalTokensEl.innerText = totalTokens.toLocaleString();
    }
    if (co2El) {
      const grams = stats.totalCO2 || 0;
      co2El.innerText =
        grams < 1 ? `${(grams * 1000).toFixed(2)} mg` : `${grams.toFixed(3)} g`;
    }
  }

  // Ask background for current stats when popup opens
  chrome.runtime.sendMessage({ type: "GET_STATS" }, (response) => {
    if (response) {
      updateStats(response);
    }
  });

  // Listen for live updates
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === "STATS_UPDATED") {
      updateStats({
        promptCount: message.promptCount,
        totalInputTokens: message.totalInputTokens,
        totalOutputTokens: message.totalOutputTokens,
      });
    }
  });

  // Optional: Add reset button handler if you have one
  const resetButton = document.getElementById("resetButton");
  if (resetButton) {
    resetButton.addEventListener("click", () => {
      chrome.runtime.sendMessage({ type: "RESET_STATS" }, (response) => {
        if (response && response.success) {
          updateStats({
            promptCount: 0,
            totalInputTokens: 0,
            totalOutputTokens: 0,
          });
        }
      });
    });
  }
});
