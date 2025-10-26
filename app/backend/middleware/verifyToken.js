// app/backend/middleware/verifyToken.js - Updated to use custom JWT
const jwt = require("jsonwebtoken");

async function verifyToken(req, res, next) {
  const header = req.headers.authorization || "";
  const match = header.match(/^Bearer (.+)$/);
  const token = match ? match[1] : null;

  if (!token) {
    return res.status(401).json({ error: "Missing Authorization header" });
  }

  try {
    // Verify custom JWT (not Firebase token)
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if token is for extension use
    if (decoded.type !== "extension") {
      return res.status(401).json({ error: "Invalid token type" });
    }

    // Attach user info to request
    req.user = {
      uid: decoded.uid,
      email: decoded.email,
    };

    console.log("✅ Token verified for user:", decoded.uid);
    next();
  } catch (err) {
    console.error("verifyToken failed:", err.message);

    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token expired" });
    }

    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

module.exports = verifyToken;
