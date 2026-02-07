// OAuth callback page for MCP server authentication
// Receives authorization code from OAuth provider and relays it back
// to the settings page via window.opener.postMessage()

export default function McpOAuthCallback() {
  return (
    <html>
      <head>
        <title>OAuth Authorization</title>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var params = new URLSearchParams(window.location.search);
                var code = params.get('code');
                var state = params.get('state');
                var error = params.get('error');
                var errorDescription = params.get('error_description');

                if (window.opener) {
                  window.opener.postMessage({
                    type: 'mcp-oauth-callback',
                    code: code,
                    state: state,
                    error: error,
                    errorDescription: errorDescription
                  }, window.location.origin);
                }

                // Close after a short delay to ensure the message is sent
                setTimeout(function() { window.close(); }, 1000);
              })();
            `,
          }}
        />
      </head>
      <body
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
          <p>Authorization complete. You can close this window.</p>
        </div>
      </body>
    </html>
  );
}
