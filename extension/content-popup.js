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

    console.log("📊 Updating UI with data:", { user, today, exceeded });

    // Update username
    if (userNameEl) {
      userNameEl.innerText = user.username || "Anonymous";
    }

    // Update today's stats (or use lifetime if today is 0)
    const displayPromptCount = today.promptCount || 0;
    const displayCo2 = today.co2Total || 0;

    if (promptCountEl) {
      promptCountEl.innerText = displayPromptCount.toLocaleString();
    }

    if (co2CountEl) {
      co2CountEl.innerText = displayCo2.toFixed(2) + "g";
    }

    // Update prompt message
    if (promptMsgEl) {
      promptMsgEl.innerText = displayPromptCount.toLocaleString();
    }

    // Update prompt message & cat image
    if (promptMessageEl && promptMsgEl) {
      const count = displayPromptCount;
      const catImgEl = document.getElementById("promptCat");

      let message = "";
      let catSrc = "";

      if (count === 0) {
        message = "A fresh start! Let’s keep it calm 🌿";
        catSrc = "icons/happy_cat.svg";
      } else if (count < 10) {
        message = "Tension rising!";
        catSrc = "icons/disappointed_cat.svg";
      } else if (count < 50) {
        message = "Slow down! ⚡";
        catSrc = "icons/shocked_cat.svg";
      } else {
        const extremeMessages = [
          "This is peak madness! 😱",
          "Take a break! 😱",
          "You're doing too much. 😱",
          "Maximum chaos unleashed! 💥",
          "Brain is mush! 🧠💥",
          "Reality is bending! 🌀",
          "Mayday, mayday! 🚨",
        ];
        message =
          extremeMessages[Math.floor(Math.random() * extremeMessages.length)];
        catSrc = "icons/sad_cat.svg";
      }

      promptMsgEl.innerText = count.toLocaleString();
      promptMessageEl.innerText = message;
      if (catImgEl) catImgEl.src = catSrc;
    }

    // Reset colors
    if (promptCountEl) promptCountEl.style.color = "";
    if (co2CountEl) co2CountEl.style.color = "";

    // Update daily limits inside the text container only
    const limitsText = document.getElementById("limitsText");

    if (limitsText) {
      limitsText.innerHTML = `
      <div id="promptLimitLine">
        <strong>Daily Prompt Limit:</strong> ${
          user.dailyLimitPrompts || "∞"
        }<br>
      </div>
      <div id="co2LimitLine" style="margin-top:6px;">
        <strong>Daily CO₂ Limit:</strong> ${
          user.dailyLimitCo2?.toFixed?.(2) || "∞"
        }g<br>
      </div>
    `;
    }

    // Highlight if exceeded
    if (exceeded.prompts || exceeded.co2) {
      console.warn("⚠️ Daily limit exceeded:", exceeded);
      if (exceeded.prompts && promptCountEl)
        promptCountEl.style.color = "#ff6b6b";
      if (exceeded.co2 && co2CountEl) co2CountEl.style.color = "#ff6b6b";
      chrome.runtime.sendMessage({
        type: "LIMIT_EXCEEDED",
        promptExceeded: exceeded.prompts,
        co2Exceeded: exceeded.co2,
      });
    }
  }

  // Logout handler
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      try {
        // Send logout message to background script
        chrome.runtime.sendMessage({ type: "LOGOUT" }, (response) => {
          if (chrome.runtime.lastError) {
            console.error("Logout error:", chrome.runtime.lastError);
            return;
          }

          if (response && response.success) {
            console.log("✅ Logged out successfully");
            // Close the popup
            window.close();
          }
        });
      } catch (error) {
        console.error("❌ Logout failed:", error);
        alert("Failed to log out. Please try again.");
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

  const editLimitsBtn = document.getElementById("editLimitsBtn");
  const modal = document.getElementById("editLimitsModal");
  const modalPromptInput = document.getElementById("modalPromptLimit");
  const modalCo2Input = document.getElementById("modalCo2Limit");
  const modalCancelBtn = document.getElementById("modalCancelBtn");
  const modalSaveBtn = document.getElementById("modalSaveBtn");

  if (editLimitsBtn) {
    editLimitsBtn.addEventListener("click", async () => {
      const token = await getToken();
      if (!token) return alert("Please log in first.");

      // Pre-fill modal with current limits
      const response = await fetch(`${BACKEND_URL}/api/stats`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        modalPromptInput.value = data.user.dailyLimitPrompts || "";
        modalCo2Input.value = data.user.dailyLimitCo2 || "";
      }

      modal.style.display = "flex"; // show modal
    });
  }

  // Cancel button
  modalCancelBtn.addEventListener("click", () => {
    modal.style.display = "none";
  });

  // Save button
  modalSaveBtn.addEventListener("click", async () => {
    const token = await getToken();
    if (!token) return alert("Please log in first.");

    try {
      const response = await fetch(`${BACKEND_URL}/api/limits`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          dailyLimitPrompts: modalPromptInput.value
            ? Number(modalPromptInput.value)
            : 0,
          dailyLimitCo2: modalCo2Input.value ? Number(modalCo2Input.value) : 0,
        }),
      });

      const data = await response.json();
      if (data.success) {
        fetchStats(); // refresh UI
        modal.style.display = "none";
      } else {
        alert("❌ Failed to update limits: " + (data.error || "Unknown error"));
      }
    } catch (err) {
      console.error("❌ Failed to set limits:", err);
      alert("Error updating limits");
    }
  });

  // Refresh stats every 30 seconds while popup is open
  setInterval(fetchStats, 30000);
});
