import { SITE_NAV } from "@constants/site-nav";
import {
	CONTACT_EMAIL,
	INSTAGRAM_ACCOUNTS,
	WHATSAPP_PHONE_DISPLAY,
} from "@utils/contact";
import { getSortedPosts, getSortedProducts } from "@utils/content-utils";
import {
	getEntryTranslationKey,
	localizePath,
	type SiteLocale,
	SUPPORTED_LOCALES,
} from "@utils/locale-utils";
import type { APIRoute, GetStaticPaths } from "astro";

/** Markdown body → compact plain text (headings and bullets kept as short lines). */
function plainText(markdown: string | undefined, max: number) {
	const text = (markdown ?? "")
		.replace(/```[\s\S]*?```/g, " ")
		.replace(/<[^>]+>/g, " ")
		.replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
		.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
		.replace(/^#+\s*/gm, "")
		.replace(/^\s*[-*]\s+/gm, "• ")
		.replace(/[*_`>|]/g, "")
		.replace(/\n{2,}/g, "\n")
		.replace(/[ \t]+/g, " ")
		.trim();
	return text.length > max ? `${text.slice(0, max).replace(/\s+\S*$/, "")}…` : text;
}

export const getStaticPaths = (() =>
	SUPPORTED_LOCALES.map((lang) => ({
		params: { lang },
	}))) satisfies GetStaticPaths;

/** Knowledge base for the AI assistant: the worker retrieves from it per question; the widget searches it offline. */
export const GET: APIRoute = async ({ params }) => {
	const locale = params.lang as SiteLocale;
	const [products, posts] = await Promise.all([
		getSortedProducts(locale),
		getSortedPosts(locale),
	]);
	products.sort(
		(a, b) =>
			a.data.group.localeCompare(b.data.group) || a.data.order - b.data.order,
	);

	const kb = {
		site: {
			name: "Tadawi Life Tech",
			phone: WHATSAPP_PHONE_DISPLAY,
			whatsapp: WHATSAPP_PHONE_DISPLAY,
			email: CONTACT_EMAIL,
			address: "Al Ghubrah, Muscat, Oman",
			hours: "9:00–13:00, 16:00–19:00",
			instagram: INSTAGRAM_ACCOUNTS.map((a) => `@${a}`),
		},
		pages: SITE_NAV.map((item) => ({
			title: item.label[locale],
			url: localizePath(item.href, locale),
			summary: item.desc[locale],
		})),
		products: products.map((entry) => ({
			title: entry.data.title,
			url: localizePath(`/products/${getEntryTranslationKey(entry)}/`, locale),
			price: entry.data.price,
			category: entry.data.category,
			group: entry.data.group,
			summary: entry.data.description,
			details: plainText(entry.body, 1400),
			faq: entry.data.faq,
		})),
		articles: posts.map((entry) => ({
			title: entry.data.title,
			url: localizePath(`/posts/${getEntryTranslationKey(entry)}/`, locale),
			summary: entry.data.description,
			details: plainText(entry.body, 2400),
		})),
	};

	return new Response(JSON.stringify(kb), {
		headers: { "Content-Type": "application/json; charset=utf-8" },
	});
};
