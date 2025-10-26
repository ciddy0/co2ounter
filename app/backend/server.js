// server.js - Fixed Firestore transaction ordering
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { db, FieldValue } = require("./firebase");
const verifyToken = require("./middleware/verifyToken");
const admin = require("firebase-admin");
const jwt = require("jsonwebtoken");
const PORT = process.env.PORT || 4000;
const app = express();

// Updated CORS to allow Chrome extension
const allowedOrigins = (
  process.env.CORS_ORIGINS || "http://localhost:3000"
).split(",");

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (origin.startsWith("chrome-extension://")) {
        return callback(null, true);
      }
      if (allowedOrigins.indexOf(origin) !== -1) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);
app.use(bodyParser.json());

// Helper: YYYY-MM-DD (UTC)
function todayKey(date = new Date()) {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// Health
app.get("/health", (req, res) => res.json({ ok: true }));

// ------------------ GET /api/stats ------------------
app.get("/api/stats", verifyToken, async (req, res) => {
  const uid = req.user.uid;
  const userRef = db.collection("users").doc(uid);
  const today = todayKey();
  const historyRef = userRef.collection("history").doc(today);

  try {
    const [userDoc, todayDoc] = await Promise.all([
      userRef.get(),
      historyRef.get(),
    ]);

    const userData = userDoc.data() || {};
    const todayData = todayDoc.data() || {};

    const exceeded = { prompts: false, co2: false };
    const dailyLimitPrompts = Number(userData.dailyLimitPrompts || 0);
    const dailyLimitCo2 = Number(userData.dailyLimitCo2 || 0);

    if (
      dailyLimitPrompts > 0 &&
      Number(todayData.promptCount || 0) >= dailyLimitPrompts
    ) {
      exceeded.prompts = true;
    }
    if (dailyLimitCo2 > 0 && Number(todayData.co2Total || 0) >= dailyLimitCo2) {
      exceeded.co2 = true;
    }

    return res.json({
      success: true,
      user: {
        username: userData.username || null,
        promptTotal: userData.promptTotal || 0,
        co2Total: userData.co2Total || 0,
        dailyLimitPrompts: userData.dailyLimitPrompts || 0,
        dailyLimitCo2: userData.dailyLimitCo2 || 0,
      },
      today: {
        promptCount: todayData.promptCount || 0,
        co2Total: todayData.co2Total || 0,
        outputTokens: todayData.outputTokens || 0,
      },
      exceeded,
    });
  } catch (err) {
    console.error("/api/stats error:", err);
    return res.status(500).json({ error: "Failed to fetch stats" });
  }
});

// ------------------ /api/prompt ------------------
app.post("/api/prompt", verifyToken, async (req, res) => {
  const uid = req.user.uid;
  const { model = "chatgpt", inputTokens = 0, co2 = 0 } = req.body;

  if (!["chatgpt", "claude", "gemini"].includes(model)) {
    return res.status(400).json({ error: "Invalid model" });
  }

  const userRef = db.collection("users").doc(uid);
  const today = todayKey();
  const historyRef = userRef.collection("history").doc(today);

  try {
    await db.runTransaction(async (tx) => {
      // ⭐ ALL READS MUST COME FIRST ⭐
      const userSnap = await tx.get(userRef);
      const historySnap = await tx.get(historyRef);

      // NOW DO ALL WRITES
      if (!userSnap.exists) {
        tx.set(
          userRef,
          {
            username: null,
            promptTotal: 0,
            co2Total: 0,
            dailyLimitPrompts: 0,
            dailyLimitCo2: 0,
            modelTotals: {},
          },
          { merge: true }
        );
      }

      const mtPromptsPath = `modelTotals.${model}.prompts`;
      const mtCo2Path = `modelTotals.${model}.co2`;
      tx.set(
        userRef,
        {
          promptTotal: FieldValue.increment(1),
          co2Total: FieldValue.increment(Number(co2)),
          [mtPromptsPath]: FieldValue.increment(1),
          [mtCo2Path]: FieldValue.increment(Number(co2)),
        },
        { merge: true }
      );

      if (!historySnap.exists) {
        tx.set(historyRef, {
          promptCount: 1,
          co2Total: Number(co2),
          modelBreakdown: {
            [model]: {
              prompts: 1,
              co2: Number(co2),
            },
          },
        });
      } else {
        tx.set(
          historyRef,
          {
            promptCount: FieldValue.increment(1),
            co2Total: FieldValue.increment(Number(co2)),
          },
          { merge: true }
        );

        const mbPromptsPath = `modelBreakdown.${model}.prompts`;
        const mbCo2Path = `modelBreakdown.${model}.co2`;
        tx.set(
          historyRef,
          {
            [mbPromptsPath]: FieldValue.increment(1),
            [mbCo2Path]: FieldValue.increment(Number(co2)),
          },
          { merge: true }
        );
      }
    });

    const [userDoc, todayDoc] = await Promise.all([
      userRef.get(),
      historyRef.get(),
    ]);

    const userData = userDoc.data() || {};
    const todayData = todayDoc.data() || {};

    const exceeded = { prompts: false, co2: false };
    const dailyLimitPrompts = Number(userData.dailyLimitPrompts || 0);
    const dailyLimitCo2 = Number(userData.dailyLimitCo2 || 0);

    if (
      dailyLimitPrompts > 0 &&
      Number(todayData.promptCount || 0) >= dailyLimitPrompts
    ) {
      exceeded.prompts = true;
    }
    if (dailyLimitCo2 > 0 && Number(todayData.co2Total || 0) >= dailyLimitCo2) {
      exceeded.co2 = true;
    }

    return res.json({
      success: true,
      exceeded,
      user: userData,
      today: todayData,
    });
  } catch (err) {
    console.error("/api/prompt error:", err);
    return res.status(500).json({ error: "Failed to record prompt" });
  }
});

// ------------------ /api/response ------------------
app.post("/api/response", verifyToken, async (req, res) => {
  const uid = req.user.uid;
  const { model = "chatgpt", outputTokens = 0, co2 = 0 } = req.body;

  if (!["chatgpt", "claude", "gemini"].includes(model)) {
    return res.status(400).json({ error: "Invalid model" });
  }

  const userRef = db.collection("users").doc(uid);
  const today = todayKey();
  const historyRef = userRef.collection("history").doc(today);

  try {
    await db.runTransaction(async (tx) => {
      // ⭐ ALL READS MUST COME FIRST ⭐
      const userSnap = await tx.get(userRef);
      const historySnap = await tx.get(historyRef);

      // NOW DO ALL WRITES
      if (!userSnap.exists) {
        tx.set(
          userRef,
          {
            username: null,
            promptTotal: 0,
            co2Total: 0,
            outputTokens: 0,
            dailyLimitPrompts: 0,
            dailyLimitCo2: 0,
            modelTotals: {},
          },
          { merge: true }
        );
      }

      const mtOutputPath = `modelTotals.${model}.outputTokens`;
      const mtCo2Path = `modelTotals.${model}.co2`;
      tx.set(
        userRef,
        {
          outputTokens: FieldValue.increment(Number(outputTokens)),
          co2Total: FieldValue.increment(Number(co2)),
          [mtOutputPath]: FieldValue.increment(Number(outputTokens)),
          [mtCo2Path]: FieldValue.increment(Number(co2)),
        },
        { merge: true }
      );

      if (!historySnap.exists) {
        tx.set(historyRef, {
          outputTokens: Number(outputTokens),
          co2Total: Number(co2),
          modelBreakdown: {
            [model]: {
              outputTokens: Number(outputTokens),
              co2: Number(co2),
            },
          },
        });
      } else {
        tx.set(
          historyRef,
          {
            outputTokens: FieldValue.increment(Number(outputTokens)),
            co2Total: FieldValue.increment(Number(co2)),
          },
          { merge: true }
        );

        const mbOutputPath = `modelBreakdown.${model}.outputTokens`;
        const mbCo2Path = `modelBreakdown.${model}.co2`;
        tx.set(
          historyRef,
          {
            [mbOutputPath]: FieldValue.increment(Number(outputTokens)),
            [mbCo2Path]: FieldValue.increment(Number(co2)),
          },
          { merge: true }
        );
      }
    });

    const [userDoc, todayDoc] = await Promise.all([
      userRef.get(),
      historyRef.get(),
    ]);

    const userData = userDoc.data() || {};
    const todayData = todayDoc.data() || {};

    const exceeded = { co2: false };
    const dailyLimitCo2 = Number(userData.dailyLimitCo2 || 0);
    if (dailyLimitCo2 > 0 && Number(todayData.co2Total || 0) >= dailyLimitCo2) {
      exceeded.co2 = true;
    }

    return res.json({
      success: true,
      exceeded,
      user: userData,
      today: todayData,
    });
  } catch (err) {
    console.error("/api/response error:", err);
    return res.status(500).json({ error: "Failed to record response" });
  }
});

// Leaderboard
app.get("/leaderboard", async (req, res) => {
  try {
    const limit = Number(process.env.LEADERBOARD_LIMIT || 20);
    const q = await db
      .collection("users")
      .orderBy("promptTotal", "desc")
      .limit(limit)
      .get();

    const results = [];
    q.forEach((doc) => {
      const d = doc.data();
      results.push({
        uid: doc.id,
        username: d.username || null,
        promptTotal: d.promptTotal || 0,
        co2Total: d.co2Total || 0,
      });
    });

    return res.json({ success: true, data: results });
  } catch (err) {
    console.error("leaderboard error:", err);
    return res.status(500).json({ error: "Failed to fetch leaderboard" });
  }
});

// Extension token exchange endpoint
app.post("/api/auth/extension-token", async (req, res) => {
  const { idToken } = req.body;

  if (!idToken) {
    return res.status(400).json({ error: "ID token is required" });
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const uid = decodedToken.uid;

    const userDoc = await db.collection("users").doc(uid).get();
    const userData = userDoc.data() || {};

    if (!process.env.JWT_SECRET) {
      console.error("❌ JWT_SECRET is not configured in .env file!");
      return res.status(500).json({ error: "Server configuration error" });
    }

    const customToken = jwt.sign(
      {
        uid,
        email: decodedToken.email,
        type: "extension",
      },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );

    return res.json({
      success: true,
      token: customToken,
      user: {
        uid,
        email: decodedToken.email,
        username: userData.username || null,
      },
    });
  } catch (err) {
    console.error("/api/auth/extension-token error:", err);
    return res.status(401).json({ error: "Invalid Firebase token" });
  }
});

app.listen(PORT, () => {
  console.log(`Backend listening on port ${PORT}`);
});
