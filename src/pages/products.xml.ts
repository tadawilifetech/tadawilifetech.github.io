import rss from "@astrojs/rss";
import { getSortedProducts } from "@utils/content-utils";
import { getEntryTranslationKey, SUPPORTED_LOCALES } from "@utils/locale-utils";
import { url } from "@utils/url-utils";
import type { APIContext } from "astro";
import MarkdownIt from "markdown-it";
import sanitizeHtml from "sanitize-html";
import { siteConfig } from "@/config";

const parser = new MarkdownIt();

function stripInvalidXmlChars(str: string): string {
	return str.replace(
		// biome-ignore lint/suspicious/noControlCharactersInRegex: https://www.w3.org/TR/xml/#charsets
		/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F﷐-﷯￾￿]/g,
		"",
	);
}

export async function GET(context: APIContext) {
	const site = context.site ?? "https://tadawilifetech.com";

	// Fetch English products (canonical)
	const products = await getSortedProducts("en");

	// Build a map of translationKey → { ar slug, fa slug } for alternate links
	const [arProducts, faProducts] = await Promise.all([
		getSortedProducts("ar"),
		getSortedProducts("fa"),
	]);
	const arMap = new Map(arProducts.map((p) => [getEntryTranslationKey(p), p]));
	const faMap = new Map(faProducts.map((p) => [getEntryTranslationKey(p), p]));

	const items = products.map((product) => {
		const slug = getEntryTranslationKey(product);
		const content = typeof product.body === "string" ? product.body : String(product.body || "");

		const imageAbsolute = product.data.image
			? new URL(product.data.image, site).href
			: "";

		const imageTag = imageAbsolute
			? `<p><img src="${imageAbsolute}" alt="${product.data.title}" /></p>`
			: "";

		const priceTag = product.data.price
			? `<p><strong>Price:</strong> ${product.data.price}</p>`
			: "";

		const categoryTag = product.data.category
			? `<p><strong>Category:</strong> ${product.data.category}</p>`
			: "";

		// Build hreflang alternate links as custom XML
		const arSlug = arMap.has(slug) ? slug : null;
		const faSlug = faMap.has(slug) ? slug : null;
		const alternates = [
			`<xhtml:link rel="alternate" hreflang="en" href="${new URL(url(`/products/${slug}/`), site).href}"/>`,
			arSlug ? `<xhtml:link rel="alternate" hreflang="ar" href="${new URL(url(`/ar/products/${arSlug}/`), site).href}"/>` : "",
			faSlug ? `<xhtml:link rel="alternate" hreflang="fa" href="${new URL(url(`/fa/products/${faSlug}/`), site).href}"/>` : "",
		].filter(Boolean).join("");

		return {
			title: product.data.title,
			pubDate: product.data.published,
			description: product.data.description || "",
			link: url(`/products/${slug}/`),
			content: sanitizeHtml(
				`${imageTag}${categoryTag}${priceTag}${parser.render(stripInvalidXmlChars(content))}`,
				{ allowedTags: sanitizeHtml.defaults.allowedTags.concat(["img"]) },
			),
			categories: [
				...(product.data.category ? [product.data.category] : []),
				...(product.data.tags || []),
			],
			customData: alternates,
		};
	});

	return rss({
		title: `${siteConfig.title} — Products`,
		description: "Sleep health products, CPAP machines, accessories and diagnostics by Tadawi Life Tech",
		site,
		items,
		customData: [
			`<language>en</language>`,
			`<atom:link href="${new URL("products.xml", site).href}" rel="self" type="application/rss+xml"/>`,
		].join(""),
		xmlns: {
			atom: "http://www.w3.org/2005/Atom",
			xhtml: "http://www.w3.org/1999/xhtml",
		},
	});
}
