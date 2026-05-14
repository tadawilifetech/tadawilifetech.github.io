import type { APIRoute } from "astro";

const site = import.meta.env.SITE || "https://tadawilifetech.com";

const robotsTxt = `
User-agent: *
Disallow: /_astro/
Disallow: /admin/
Disallow: /admin-comments/

Sitemap: ${new URL("sitemap-index.xml", site).href}
`.trim();

export const GET: APIRoute = () => {
	return new Response(robotsTxt, {
		headers: {
			"Content-Type": "text/plain; charset=utf-8",
		},
	});
};
