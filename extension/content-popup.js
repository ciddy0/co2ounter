// content-popup.js - Updated to fetch from Firebase
document.addEventListener("DOMContentLoaded", async () => {
  const promptCountEl = document.getElementById("promptCount");
  const co2CountEl = document.getElementById("co2Count");
  const promptMsgEl = document.getElementById("promptMsg");
  const promptMessageEl = document.getElementById("promptMessage");
  const userNameEl = document.getElementById("userName");
  const logoutBtn = document.getElementById("logoutBtn");
  const dashboardBtn = document.getElementById("dashboardBtn");

  const BACKEND_URL = "http://localhost:4000";

  // Get token from storage
  async function getToken() {
    return new Promise((resolve) => {
      chrome.storage.sync.get({ firebaseToken: null }, (data) => {
        resolve(data.firebaseToken);
      });
    });
  }

  // Fetch stats from backend
  async function fetchStats() {
    const token = await getToken();

    if (!token) {
      console.warn("⚠️ No token found, redirecting to login");
      // Show login required state
      if (userNameEl) userNameEl.innerText = "Not logged in";
      if (promptCountEl) promptCountEl.innerText = "0";
      if (co2CountEl) co2CountEl.innerText = "0g";
      return;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/api/stats`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("📊 Stats fetched from Firebase:", data);

      if (data.success) {
        updateUI(data);
      }
    } catch (error) {
      console.error("❌ Failed to fetch stats:", error);
      if (userNameEl) userNameEl.innerText = "Error loading data";
      if (promptCountEl) promptCountEl.innerText = "?";
      if (co2CountEl) co2CountEl.innerText = "?";
    }
  }

  // Update UI with fetched data
  function updateUI(data) {
    const { user, today, exceeded } = data;

    // Update username
    if (userNameEl) {
      userNameEl.innerText = user.username || "Anonymous";
    }

    // Update today's stats
    if (promptCountEl) {
      promptCountEl.innerText = (today.promptCount || 0).toLocaleString();
    }

    if (co2CountEl) {
      co2CountEl.innerText = (today.co2Total || 0).toFixed(2) + "g";
    }

    // Update prompt message
    if (promptMsgEl) {
      promptMsgEl.innerText = (today.promptCount || 0).toLocaleString();
    }

    // Update message based on prompt count
    if (promptMessageEl) {
      const count = today.promptCount || 0;
      if (count === 0) {
        promptMessageEl.innerText = " today. Let's get started!";
      } else if (count < 10) {
        promptMessageEl.innerText = " today. Looking good!";
      } else if (count < 50) {
        promptMessageEl.innerText = " today. Keep it up!";
      } else {
        promptMessageEl.innerText = " today. Let's tone it down!";
      }
    }

    // Show visual feedback for exceeded limits
    if (exceeded.prompts || exceeded.co2) {
      console.warn("⚠️ Daily limit exceeded:", exceeded);
      // You can add visual indicators here
      if (exceeded.prompts && promptCountEl) {
        promptCountEl.style.color = "#ff6b6b";
      }
      if (exceeded.co2 && co2CountEl) {
        co2CountEl.style.color = "#ff6b6b";
      }
    }
  }

  // Logout handler
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      if (confirm("Are you sure you want to log out?")) {
        try {
          // Send logout message to background script
          chrome.runtime.sendMessage({ type: "LOGOUT" }, (response) => {
            if (chrome.runtime.lastError) {
              console.error("Logout error:", chrome.runtime.lastError);
              return;
            }

            if (response && response.success) {
              console.log("✅ Logged out successfully");
              // The background script will update the popup to welcome-popup.html
              // So we just close this popup
              window.close();
            }
          });
        } catch (error) {
          console.error("❌ Logout failed:", error);
          alert("Failed to log out. Please try again.");
        }
      }
    });
  }

  // Dashboard button handler
  if (dashboardBtn) {
    dashboardBtn.addEventListener("click", () => {
      chrome.tabs.create({ url: "http://localhost:3000/dashboard" });
    });
  }

  // Initial fetch
  await fetchStats();

  // Listen for updates from background script
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === "STATS_UPDATED") {
      console.log("🔄 Stats updated, refreshing...");
      fetchStats(); // Re-fetch from Firebase
    }
  });

  // Refresh stats every 30 seconds while popup is open
  setInterval(fetchStats, 30000);
});
