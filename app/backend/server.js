// app/backend/server.js
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { db, FieldValue } = require("./firebase");
const verifyToken = require("./middleware/verifyToken");

const PORT = process.env.PORT || 4000;
const app = express();

const allowedOrigins = (
  process.env.CORS_ORIGINS || "http://localhost:3000"
).split(",");

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1) return callback(null, true);
      return callback(new Error("Not allowed by CORS"));
    },
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

// ------------------ /api/prompt ------------------
// Expects body: { model: "chatgpt"|"claude"|"gemini", inputTokens: number, co2: number }
// increments: users/{uid}.promptTotal, users/{uid}.co2Total,
//            users/{uid}.modelTotals.{model}.prompts & co2
//            users/{uid}/history/{YYYY-MM-DD}.promptCount, co2Total, modelBreakdown.{model}.prompts & co2
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
      const userSnap = await tx.get(userRef);
      if (!userSnap.exists) {
        // create minimal user doc (so leaderboards work)
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

      // user-level increments
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

      // today's history increments
      tx.set(
        historyRef,
        {
          promptCount: FieldValue.increment(1),
          co2Total: FieldValue.increment(Number(co2)),
        },
        { merge: true }
      );

      // nested increments for modelBreakdown
      const mbPromptsPath = `modelBreakdown.${model}.prompts`;
      const mbCo2Path = `modelBreakdown.${model}.co2`;
      // use update (if doc didn't exist set above created it); update will create fields if parent exists
      tx.update(historyRef, {
        [mbPromptsPath]: FieldValue.increment(1),
        [mbCo2Path]: FieldValue.increment(Number(co2)),
      });
    });

    // fetch updated docs to return status
    const [userDoc, todayDoc] = await Promise.all([
      userRef.get(),
      historyRef.get(),
    ]);

    const userData = userDoc.data() || {};
    const todayData = todayDoc.data() || {};

    // check daily limits
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
// Expects body: { model: "chatgpt"|"claude"|"gemini", outputTokens: number, co2: number }
// increments: users/{uid}.outputTokens, users/{uid}.co2Total,
//            users/{uid}.modelTotals.{model}.outputTokens & co2
//            users/{uid}/history/{YYYY-MM-DD}.outputTokens, co2Total, modelBreakdown.{model}.outputTokens & co2
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
      const userSnap = await tx.get(userRef);
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

      // update today's history
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
      tx.update(historyRef, {
        [mbOutputPath]: FieldValue.increment(Number(outputTokens)),
        [mbCo2Path]: FieldValue.increment(Number(co2)),
      });
    });

    const [userDoc, todayDoc] = await Promise.all([
      userRef.get(),
      historyRef.get(),
    ]);

    const userData = userDoc.data() || {};
    const todayData = todayDoc.data() || {};

    // CO2 limit check (responses may add CO2)
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

// Leaderboard example (by promptTotal)
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

app.listen(PORT, () => {
  console.log(`Backend listening on port ${PORT}`);
});
