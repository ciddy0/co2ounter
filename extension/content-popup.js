// content-popup.js
document.addEventListener("DOMContentLoaded", () => {
  const promptCountEl = document.getElementById("promptCount");
  const co2CountEl = document.getElementById("co2Count");
  const promptMsgEl = document.getElementById("promptMsg");
  const userNameEl = document.getElementById("userName");
  const logoutBtn = document.getElementById("logoutBtn");
  const dashboardBtn = document.getElementById("dashboardBtn");

  // Logout functionality
  logoutBtn.addEventListener("click", () => {
    chrome.storage.local.remove(["userToken", "userName"], () => {
      window.location.reload();
    });
  });

  // Dashboard button
  dashboardBtn.addEventListener("click", () => {
    chrome.tabs.create({ url: "http://localhost:3000/dashboard" });
  });

  // Load user name
  chrome.storage.local.get(["userName"], (data) => {
    if (userNameEl && data.userName) {
      userNameEl.innerText = data.userName;
    } else if (userNameEl) {
      userNameEl.innerText = "User";
    }
  });

  function updateStats(stats) {
    if (promptCountEl)
      promptCountEl.innerText = (stats.promptCount || 0).toLocaleString();
    if (co2CountEl)
      co2CountEl.innerText = (stats.totalCO2 || 0).toFixed(2) + "g";
    if (promptMsgEl)
      promptMsgEl.innerText = (stats.promptCount || 0).toLocaleString();
  }

  // Initial read
  chrome.storage.local.get(["promptCount", "totalCO2"], (data) => {
    updateStats(data);
  });

  // Live updates
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === "STATS_UPDATED") {
      updateStats(message.stats);
    }
  });
});
