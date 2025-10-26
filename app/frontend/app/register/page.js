"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";

// Firebase config
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);

  // Create Firestore document for new user
  async function createUserDoc(user, username) {
    await setDoc(doc(db, "users", user.uid), {
      username,
      promptTotal: 0,
      co2Total: 0,
      dailyLimitPrompts: 50,
      dailyLimitCo2: 2.5,
      modelTotals: {
        chatgpt: { prompts: 0, co2: 0 },
        claude: { prompts: 0, co2: 0 },
        gemini: { prompts: 0, co2: 0 },
      },
    });
  }

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // Get Firebase token
      const token = await user.getIdToken();

      // **Safe storage:** Chrome extension or normal web
      if (typeof chrome !== "undefined" && chrome.storage?.sync) {
        chrome.storage.sync.set({ firebaseToken: token }, () => {
          console.log("✅ Firebase token stored in chrome.storage.sync");
        });
      } else {
        localStorage.setItem("firebaseToken", token);
        console.log("✅ Firebase token stored in localStorage");
      }

      // Create Firestore user document
      await createUserDoc(user, username);
      console.log("✅ User document created in Firestore");

      // Navigate to home/dashboard
      router.push("/");
    } catch (err) {
      console.error("❌ Registration error:", err);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Register</h1>
      <form onSubmit={handleRegister}>
        <div>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            required
          />
        </div>
        <div>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
          />
        </div>
        <div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? "Registering..." : "Register"}
        </button>
      </form>
    </div>
  );
}
