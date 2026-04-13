# Decap CMS OAuth – Cloudflare Worker

This is a lightweight GitHub OAuth proxy for Decap CMS, required because the site runs on GitHub Pages (not Netlify).

## Setup (one-time)

### 1. Create a GitHub OAuth App

1. Go to **https://github.com/settings/developers** → **OAuth Apps** → **New OAuth App**
2. Fill in:
   - **Application name**: `Tadawi CMS`
   - **Homepage URL**: `https://tadawilifetech.com`
   - **Authorization callback URL**: `https://decap-cms-oauth.<YOUR-CF-SUBDOMAIN>.workers.dev/callback`
3. Click **Register application**
4. Copy the **Client ID**
5. Generate a **Client secret** and copy it

### 2. Deploy the Worker

```bash
cd oauth-worker
npm install -g wrangler    # if not installed
wrangler login             # authenticate with Cloudflare
wrangler deploy            # deploys the worker
```

### 3. Set secrets

```bash
npx wrangler secret put GITHUB_CLIENT_ID
# paste the Client ID from step 1

npx wrangler secret put GITHUB_CLIENT_SECRET
# paste the Client Secret from step 1
```

### 4. Update CMS config

After deploying, update `public/admin/config.yml`:

```yaml
backend:
  name: github
  repo: tadawilifetech/tadawilifetech.github.io
  branch: main
  base_url: https://decap-cms-oauth.<YOUR-CF-SUBDOMAIN>.workers.dev
  auth_endpoint: auth
```

Replace `<YOUR-CF-SUBDOMAIN>` with your Cloudflare Workers subdomain.

### 5. Update GitHub OAuth callback URL

Go back to GitHub OAuth App settings and set the callback URL to:
```
https://decap-cms-oauth.<YOUR-CF-SUBDOMAIN>.workers.dev/callback
```

## How it works

1. CMS opens a popup → `/auth` on the Worker
2. Worker redirects to GitHub OAuth authorize page
3. User authorizes → GitHub redirects to `/callback` with a code
4. Worker exchanges the code for an access token (server-side)
5. Callback page sends the token back to the CMS window via `postMessage`
