// OAuth callback page for MCP server authentication
// Receives authorization code from OAuth provider and relays it back
// to the settings page via window.opener.postMessage() and localStorage fallback

import { useEffect, useState } from "react";

export default function McpOAuthCallback() {
  const [status, setStatus] = useState("Processing...");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const msg = {
      type: "mcp-oauth-callback" as const,
      code: params.get("code"),
      state: params.get("state"),
      error: params.get("error"),
      errorDescription: params.get("error_description"),
    };

    // Try postMessage to opener (popup flow)
    if (window.opener) {
      try {
        window.opener.postMessage(msg, window.location.origin);
      } catch {
        // postMessage failed, fall through to localStorage
      }
    }

    // Always write to localStorage as fallback
    try {
      localStorage.setItem("mcp-oauth-callback", JSON.stringify(msg));
      setTimeout(() => {
        localStorage.removeItem("mcp-oauth-callback");
      }, 5000);
    } catch {
      // localStorage unavailable
    }

    setStatus("Authorization complete. You can close this window.");

    setTimeout(() => {
      window.close();
    }, 2000);
  }, []);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        margin: 0,
        fontFamily: "system-ui, sans-serif",
        backgroundColor: "#f9fafb",
        color: "#374151",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <p>{status}</p>
      </div>
    </div>
  );
}
