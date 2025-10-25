// app/backend/firebase.js
const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

const serviceAccountPath =
  process.env.SERVICE_ACCOUNT_PATH ||
  path.join(__dirname, "serviceAccountKey.json");

if (!fs.existsSync(serviceAccountPath)) {
  console.error(
    "Missing Firebase service account JSON at:",
    serviceAccountPath
  );
  process.exit(1);
}

const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const auth = admin.auth();
const FieldValue = admin.firestore.FieldValue;

module.exports = { admin, db, auth, FieldValue };
