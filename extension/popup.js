// popup.js
document.addEventListener("DOMContentLoaded", () => {
  const countEl = document.getElementById("count");
  const inputEl = document.getElementById("inputTokens");
  const outputEl = document.getElementById("outputTokens");
  const totalEl = document.getElementById("totalTokens");
  const co2El = document.getElementById("co2");

  // Login/Register buttons
  const loginBtn = document.querySelectorAll(".entry-button")[0];
  const registerBtn = document.querySelectorAll(".entry-button")[1];

  loginBtn.addEventListener("click", () => {
    chrome.tabs.create({ url: "http://localhost:3000/login" });
  });

  registerBtn.addEventListener("click", () => {
    chrome.tabs.create({ url: "http://localhost:3000/register" });
  });

  function updateStats(stats) {
    if (countEl) countEl.innerText = (stats.promptCount || 0).toLocaleString();
    if (inputEl)
      inputEl.innerText = (stats.totalInputTokens || 0).toLocaleString();
    if (outputEl)
      outputEl.innerText = (stats.totalOutputTokens || 0).toLocaleString();
    if (totalEl)
      totalEl.innerText = (
        (stats.totalInputTokens || 0) + (stats.totalOutputTokens || 0)
      ).toLocaleString();
    if (co2El) co2El.innerText = (stats.totalCO2 || 0).toFixed(2) + " g";
  }

  // Initial read
  chrome.storage.local.get(
    ["promptCount", "totalInputTokens", "totalOutputTokens", "totalCO2"],
    (data) => {
      updateStats(data);
    }
  );

  // Live updates
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === "STATS_UPDATED") {
      updateStats(message.stats);
    }
  });
});
