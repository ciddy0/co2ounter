let firebaseToken = null;

// Load Firebase token for authenticated sync
chrome.storage.sync.get({ firebaseToken: null }, (data) => {
  firebaseToken = data.firebaseToken;
  console.log("🔑 Loaded Firebase token:", firebaseToken ? "YES" : "NO");
});

// helper to send data to backend
async function syncWithBackend(endpoint, body) {
  if (!firebaseToken) {
    console.warn("⚠️ No Firebase token, skipping backend sync");
    return;
  }

  try {
    await fetch("https://our-backend.com" + endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${firebaseToken}`,
      },
      body: JSON.stringify(body),
    });
    console.log("☁️ Synced to backend:", endpoint, body);
  } catch (err) {
    console.error("❌ Backend sync failed:", err);
  }
}
