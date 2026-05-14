import rss from "@astrojs/rss";
import { getSortedPosts, getSortedProducts } from "@utils/content-utils";
import { getEntryTranslationKey } from "@utils/locale-utils";
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

	const [posts, products] = await Promise.all([
		getSortedPosts(),
		getSortedProducts(),
	]);

	const postItems = posts.map((post) => {
		const content = typeof post.body === "string" ? post.body : String(post.body || "");
		return {
			title: post.data.title,
			pubDate: post.data.published,
			description: post.data.description || "",
			link: url(`/posts/${post.slug}/`),
			content: sanitizeHtml(parser.render(stripInvalidXmlChars(content)), {
				allowedTags: sanitizeHtml.defaults.allowedTags.concat(["img"]),
			}),
			categories: [
				...(post.data.category ? [post.data.category] : []),
				...(post.data.tags || []),
			],
		};
	});

	const productItems = products.map((product) => {
		const slug = getEntryTranslationKey(product);
		const content = typeof product.body === "string" ? product.body : String(product.body || "");
		const imageTag = product.data.image
			? `<p><img src="${new URL(product.data.image, site).href}" alt="${product.data.title}" /></p>`
			: "";
		const priceTag = product.data.price
			? `<p><strong>Price:</strong> ${product.data.price}</p>`
			: "";
		return {
			title: product.data.title,
			pubDate: product.data.published,
			description: product.data.description || "",
			link: url(`/products/${slug}/`),
			content: sanitizeHtml(
				`${imageTag}${priceTag}${parser.render(stripInvalidXmlChars(content))}`,
				{ allowedTags: sanitizeHtml.defaults.allowedTags.concat(["img"]) },
			),
			categories: [
				...(product.data.category ? [product.data.category] : []),
				...(product.data.tags || []),
			],
		};
	});

	// Merge and sort by date descending
	const allItems = [...postItems, ...productItems].sort(
		(a, b) => b.pubDate.getTime() - a.pubDate.getTime(),
	);

	return rss({
		title: siteConfig.title,
		description: siteConfig.subtitle || "Sleep health products and articles",
		site,
		items: allItems,
		customData: [
			`<language>${siteConfig.lang}</language>`,
			`<atom:link href="${new URL("rss.xml", site).href}" rel="self" type="application/rss+xml"/>`,
		].join(""),
		xmlns: { atom: "http://www.w3.org/2005/Atom" },
	});
}
