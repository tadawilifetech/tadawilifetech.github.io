/**
 * Cloudflare Worker – GitHub OAuth proxy for Decap CMS
 *
 * Environment variables (set via `wrangler secret put`):
 *   GITHUB_CLIENT_ID     – from your GitHub OAuth App
 *   GITHUB_CLIENT_SECRET – from your GitHub OAuth App
 *
 * Endpoints:
 *   GET /auth      → redirects the user to GitHub's authorize page
 *   GET /callback  → exchanges code for token, sends it to Decap CMS via postMessage
 */

const GITHUB_AUTHORIZE_URL = "https://github.com/login/oauth/authorize";
const GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token";

function corsHeaders(origin) {
  return {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(request.headers.get("Origin")),
      });
    }

    if (url.pathname === "/auth") {
      const scope = url.searchParams.get("scope") || "repo,user";
      const params = new URLSearchParams({
        client_id: env.GITHUB_CLIENT_ID,
        redirect_uri: `${url.origin}/callback`,
        scope,
        state: crypto.randomUUID(),
      });
      return Response.redirect(
        `${GITHUB_AUTHORIZE_URL}?${params.toString()}`,
        302,
      );
    }

    if (url.pathname === "/callback") {
      const oauthError = url.searchParams.get("error");
      const oauthErrorDescription = url.searchParams.get("error_description");
      const code = url.searchParams.get("code");

      if (oauthError) {
        return new Response(
          callbackPage("github", null, oauthErrorDescription || oauthError),
          { status: 401, headers: { "Content-Type": "text/html;charset=utf-8" } },
        );
      }

      if (!code) {
        return new Response(
          callbackPage("github", null, "Missing code parameter"),
          { status: 400, headers: { "Content-Type": "text/html;charset=utf-8" } },
        );
      }

      const tokenResponse = await fetch(GITHUB_TOKEN_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          client_id: env.GITHUB_CLIENT_ID,
          client_secret: env.GITHUB_CLIENT_SECRET,
          code,
          redirect_uri: `${url.origin}/callback`,
        }),
      });

      const tokenData = await tokenResponse.json();

      if (tokenData.error) {
        return new Response(
          callbackPage("github", null, tokenData.error_description || tokenData.error),
          { status: 401, headers: { "Content-Type": "text/html;charset=utf-8" } },
        );
      }

      return new Response(
        callbackPage("github", tokenData.access_token, null),
        { headers: { "Content-Type": "text/html;charset=utf-8" } },
      );
    }

    return new Response("Not found", { status: 404 });
  },
};

/**
 * Returns an HTML page that relays the auth result back to the CMS opener
 * window using the Decap CMS postMessage protocol.
 */
function callbackPage(provider, token, error) {
  const status = error ? "error" : "success";
  const content = error
    ? JSON.stringify(error)
    : JSON.stringify({ token, provider });
  const payload = JSON.stringify(`authorization:${provider}:${status}:${content}`);
  const handshake = JSON.stringify(`authorizing:${provider}`);
  const heading = error ? "Authentication failed" : "Authentication complete";
  const detail = error
    ? error
    : "You can close this window if it does not close automatically.";

  return `<!doctype html>
<html>
<head>
<title>OAuth Callback</title>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
body {
  margin: 0;
  min-height: 100vh;
  display: grid;
  place-items: center;
  font-family: system-ui, sans-serif;
  background: #f8fafc;
  color: #0f172a;
}
.panel {
  width: min(32rem, calc(100vw - 2rem));
  padding: 1.25rem 1.5rem;
  border-radius: 1rem;
  background: white;
  box-shadow: 0 20px 60px rgba(15, 23, 42, 0.12);
}
h1 {
  margin: 0 0 .75rem;
  font-size: 1.125rem;
}
p {
  margin: 0;
  line-height: 1.6;
  color: #475569;
  white-space: pre-wrap;
}
</style>
</head>
<body>
<div class="panel">
  <h1>${heading}</h1>
  <p id="message">${detail}</p>
</div>
<script>
(function () {
  const messageEl = document.getElementById("message");
  const payload = ${payload};
  const handshake = ${handshake};
  const shouldAutoClose = ${error ? "false" : "true"};
  let relayTimer = null;
  let closeTimer = null;

  function setMessage(message) {
    if (messageEl) {
      messageEl.textContent = message;
    }
  }

  function stopRelay() {
    if (relayTimer) {
      window.clearInterval(relayTimer);
      relayTimer = null;
    }
    if (closeTimer) {
      window.clearTimeout(closeTimer);
      closeTimer = null;
    }
  }

  function closeWindow() {
    if (!shouldAutoClose) {
      return;
    }
    setMessage("Authentication complete. Closing window...");
    stopRelay();
    window.setTimeout(function () {
      window.close();
    }, 120);
  }

  function relayToOpener() {
    try {
      window.opener.postMessage(handshake, "*");
      window.opener.postMessage(payload, "*");
    } catch (error) {
      setMessage("Unable to communicate with the CMS window. Return to the CMS tab and try again.");
      stopRelay();
      return;
    }
  }

  if (!window.opener) {
    setMessage("This callback window has no opener. Return to the CMS and try signing in again.");
    return;
  }

  function sendMessage(e) {
    if (e.data !== handshake) {
      return;
    }

    window.opener.postMessage(payload, e.origin);
    window.removeEventListener("message", sendMessage);
    closeWindow();
  }

  window.addEventListener("message", sendMessage);
  relayToOpener();
  relayTimer = window.setInterval(relayToOpener, 250);

  if (shouldAutoClose) {
    closeTimer = window.setTimeout(closeWindow, 1800);
  }

  window.setTimeout(function () {
    if (shouldAutoClose) {
      setMessage("Finishing sign-in. If this window stays open, return to the CMS tab.");
    } else {
      setMessage("Waiting for the CMS window to finish authentication. If this stays open, return to the CMS tab and try again.");
    }
  }, 1500);
})();
</script>
</body>
</html>`;
}
