// app/backend/middleware/verifyToken.js
const { auth } = require("../firebase");

async function verifyToken(req, res, next) {
  const header = req.headers.authorization || "";
  const match = header.match(/^Bearer (.+)$/);
  const idToken = match ? match[1] : null;

  if (!idToken) {
    return res.status(401).json({ error: "Missing Authorization header" });
  }

  try {
    const decoded = await auth.verifyIdToken(idToken);
    req.user = {
      uid: decoded.uid,
      email: decoded.email || null,
    };
    next();
  } catch (err) {
    console.error("verifyToken failed:", err);
    return res.status(401).json({ error: "Invalid or expired ID token" });
  }
}

module.exports = verifyToken;
