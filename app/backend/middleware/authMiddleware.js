// app/backend/middleware/authMiddleware.js
const { auth } = require("../firebase");

async function verifyFirebaseToken(req, res, next) {
  const header = req.headers.authorization || "";
  const match = header.match(/^Bearer (.+)$/);
  const idToken = match ? match[1] : null;

  if (!idToken) {
    return res
      .status(401)
      .json({ error: "Missing Authorization header (Bearer <token>)" });
  }

  try {
    const decoded = await auth.verifyIdToken(idToken);
    req.user = {
      uid: decoded.uid,
      email: decoded.email,
      name: decoded.name || null,
      claims: decoded,
    };
    next();
  } catch (err) {
    console.error("Token verification failed:", err);
    return res.status(401).json({ error: "Invalid or expired ID token" });
  }
}

module.exports = verifyFirebaseToken;
