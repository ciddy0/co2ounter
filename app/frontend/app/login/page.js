"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault(); // Prevent form from reloading the page
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;
      // Step 2: Get Firebase ID token
      const firebaseIdToken = await user.getIdToken();
      console.log("🔑 Got Firebase ID token");

      // Step 3: Exchange Firebase token for custom extension token
      // Step 3: Exchange Firebase token for custom extension token
      const response = await fetch(
        "http://localhost:4000/api/auth/extension-token",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ idToken: firebaseIdToken }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate extension token");
      }

      console.log("✅ Custom extension token generated");

      // Step 4: Send custom token to extension via postMessage
      window.postMessage(
        {
          type: "FIREBASE_TOKEN",
          token: data.token, // This is the custom 30-day JWT
          user: data.user,
        },
        "*"
      );

      // Also store in localStorage for web app use
      localStorage.setItem("firebaseToken", data.token);
      console.log("💾 Token saved to localStorage");

      // Show success message
      alert("✅ Login successful! Extension is now connected.");
      setTimeout(() => {
        console.log("✅ Navigating to home...");
        router.push("/");
      }, 300);
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Login</h1>
      <form onSubmit={handleLogin}>
        <div>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            type="email"
            required
          />
        </div>
        <div>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            type="password"
            required
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>
    </div>
  );
}
