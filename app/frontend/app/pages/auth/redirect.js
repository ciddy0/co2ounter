// app/frontend/pages/auth/redirect.js
import { useEffect } from "react";

export default function AuthRedirect() {
  useEffect(() => {
    const fragment = window.location.hash || "";
    const match = fragment.match(/token=([^&]+)/);
    const token = match ? decodeURIComponent(match[1]) : null;

    if (token) {
      // store locally for website
      try {
        localStorage.setItem("idToken", token);
      } catch (e) {}

      // post to page context (content script will forward to extension)
      // use '*' purposely because extension content script checks origin
      window.postMessage(
        { type: "EXTENSION_AUTH_TOKEN", token },
        window.location.origin
      );

      // show a short message then close tab (if opened by extension)
      setTimeout(() => {
        window.close();
      }, 700);
    } else {
      console.warn("No token found in fragment");
    }
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h2>Signing you into the extension…</h2>
      <p>
        If the extension does not pick up the token automatically, copy the
        token from the URL and paste it into the extension settings.
      </p>
    </div>
  );
}
