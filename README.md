# tadawilifetech.com

## Decap CMS

This project now includes a Decap CMS panel for managing blog content and the About page.

### Included routes and files

- Admin route: `/admin/`
- CMS page: `src/pages/admin.astro`
- CMS config: `public/admin/config.yml`

### Managed content

- Posts: `src/content/posts/**`
- About page: `src/content/spec/about.md`

### Local usage

Run the Astro dev server in one terminal:

```bash
pnpm dev
```

Run the Decap local proxy in another terminal:

```bash
pnpm cms-proxy
```

Then open `/admin/` on your local site.

### Production authentication

This repository is currently a static Astro site. Decap CMS can render the admin panel immediately, but production login still requires an authentication backend.

If you deploy on Netlify:

- Use Netlify Identity or Git Gateway.

If you keep deploying on GitHub Pages, Vercel, or another non-Netlify host:

- Create or deploy an external OAuth client for Decap.
- Add `base_url` and `auth_endpoint` under `backend` in `public/admin/config.yml`.

This repository is configured to use the Cloudflare Worker at `https://decap-cms-oauth.miladsoft.workers.dev` for production Decap OAuth.
You still need to set the Worker secrets `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET`, and configure the GitHub OAuth App callback URL to `https://decap-cms-oauth.miladsoft.workers.dev/callback`.

Without that OAuth step, `/admin/` will load but production login and saving to GitHub will not complete.