// popup.js
document.addEventListener("DOMContentLoaded", function () {
  const countEl = document.getElementById("count");
  const inputTokensEl = document.getElementById("inputTokens");
  const outputTokensEl = document.getElementById("outputTokens");
  const totalTokensEl = document.getElementById("totalTokens");
  const co2El = document.getElementById("co2");

  function updateStats(stats) {
    if (countEl) countEl.innerText = (stats.promptCount || 0).toLocaleString();
    if (inputTokensEl)
      inputTokensEl.innerText = (stats.totalInputTokens || 0).toLocaleString();
    if (outputTokensEl)
      outputTokensEl.innerText = (
        stats.totalOutputTokens || 0
      ).toLocaleString();
    if (totalTokensEl) {
      const total =
        (stats.totalInputTokens || 0) + (stats.totalOutputTokens || 0);
      totalTokensEl.innerText = total.toLocaleString();
    }
    if (co2El) {
      const grams = stats.totalCO2 || 0;
      co2El.innerText =
        grams < 1 ? `${(grams * 1000).toFixed(2)} mg` : `${grams.toFixed(3)} g`;
    }
  }

  // Fetch stats once when popup opens
  chrome.runtime.sendMessage({ type: "GET_STATS" }, (response) => {
    if (response) updateStats(response);
  });

  // Listen for live updates from background
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === "STATS_UPDATED" && message.stats) {
      updateStats(message.stats);
    }
  });

  // Reset Button
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
