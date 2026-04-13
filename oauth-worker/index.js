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
      const params = new URLSearchParams({
        client_id: env.GITHUB_CLIENT_ID,
        redirect_uri: `${url.origin}/callback`,
        scope: "repo,user",
        state: crypto.randomUUID(),
      });
      return Response.redirect(
        `${GITHUB_AUTHORIZE_URL}?${params.toString()}`,
        302,
      );
    }

    if (url.pathname === "/callback") {
      const code = url.searchParams.get("code");

      if (!code) {
        return new Response("Missing code parameter", { status: 400 });
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

  return `<!doctype html>
<html>
<head><title>OAuth Callback</title></head>
<body>
<script>
(function () {
  function sendMessage(e) {
    window.opener.postMessage(
      "authorization:${provider}:${status}:${content}",
      e.origin
    );
    window.removeEventListener("message", sendMessage);
  }
  window.addEventListener("message", sendMessage);
  window.opener.postMessage("authorizing:${provider}", "*");
})();
</script>
</body>
</html>`;
}
