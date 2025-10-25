// app/frontend/pages/auth/redirect.js
import { useEffect } from "react";
import { useRouter } from "next/router";

export default function AuthRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Extract token from URL fragment
    const fragment = typeof window !== "undefined" ? window.location.hash : "";
    const match = fragment.match(/token=([^&]+)/);
    const token = match ? decodeURIComponent(match[1]) : null;

    // Post message to page context so content script can pick it up
    if (token) {
      window.postMessage(
        { type: "EXTENSION_AUTH_TOKEN", token },
        window.location.origin
      );
      setTimeout(() => {
        // attempt to close; if tab was opened by extension, it will close
        window.close();
      }, 700);
    } else {
      console.warn("No token in fragment");
    }
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h2>Sending token to the extension…</h2>
      <p>
        If nothing happens, copy the token from the URL and paste it into the
        extension.
      </p>
    </div>
  );
}
