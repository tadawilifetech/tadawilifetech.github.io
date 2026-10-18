import { SITE_NAV } from "@constants/site-nav";
import {
	CONTACT_EMAIL,
	INSTAGRAM_ACCOUNTS,
	WHATSAPP_PHONE_DISPLAY,
} from "@utils/contact";
import { getSortedProducts } from "@utils/content-utils";
import {
	getEntryTranslationKey,
	localizePath,
	type SiteLocale,
	SUPPORTED_LOCALES,
} from "@utils/locale-utils";
import type { APIRoute, GetStaticPaths } from "astro";

export const getStaticPaths = (() =>
	SUPPORTED_LOCALES.map((lang) => ({
		params: { lang },
	}))) satisfies GetStaticPaths;

/** Compact knowledge base for the AI assistant (server prompt + offline search). */
export const GET: APIRoute = async ({ params }) => {
	const locale = params.lang as SiteLocale;
	const products = await getSortedProducts(locale);
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
			faq: entry.data.faq.slice(0, 4),
		})),
	};

	return new Response(JSON.stringify(kb), {
		headers: { "Content-Type": "application/json; charset=utf-8" },
	});
};
