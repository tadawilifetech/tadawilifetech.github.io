import { type CollectionEntry, getCollection } from "astro:content";
import I18nKey from "@i18n/i18nKey";
import { i18n } from "@i18n/translation";
import { DEFAULT_LOCALE, type SiteLocale, getEntryTranslationKey, normalizeLocale } from "@utils/locale-utils";
import { getCategoryUrl } from "@utils/url-utils.ts";

// // Retrieve posts and sort them by publication date
async function getRawSortedPosts(lang: SiteLocale = DEFAULT_LOCALE) {
	const allBlogPosts = await getCollection("posts", ({ data }) => {
		const matchesLocale = normalizeLocale(data.lang) === lang;
		return (import.meta.env.PROD ? data.draft !== true : true) && matchesLocale;
	});

	const sorted = allBlogPosts.sort((a, b) => {
		const dateA = new Date(a.data.published);
		const dateB = new Date(b.data.published);
		return dateA > dateB ? -1 : 1;
	});
	return sorted;
}

export async function getSortedPosts(lang: SiteLocale = DEFAULT_LOCALE) {
	const sorted = await getRawSortedPosts(lang);

	for (let i = 1; i < sorted.length; i++) {
		sorted[i].data.nextSlug = getEntryTranslationKey(sorted[i - 1]);
		sorted[i].data.nextTitle = sorted[i - 1].data.title;
	}
	for (let i = 0; i < sorted.length - 1; i++) {
		sorted[i].data.prevSlug = getEntryTranslationKey(sorted[i + 1]);
		sorted[i].data.prevTitle = sorted[i + 1].data.title;
	}

	return sorted;
}
export type PostForList = {
	slug: string;
	data: CollectionEntry<"posts">["data"];
};
export async function getSortedPostsList(lang: SiteLocale = DEFAULT_LOCALE): Promise<PostForList[]> {
	const sortedFullPosts = await getRawSortedPosts(lang);

	// delete post.body
	const sortedPostsList = sortedFullPosts.map((post) => ({
		slug: getEntryTranslationKey(post),
		data: post.data,
	}));

	return sortedPostsList;
}
export type Tag = {
	name: string;
	count: number;
};

export async function getTagList(lang: SiteLocale = DEFAULT_LOCALE): Promise<Tag[]> {
	const allBlogPosts = await getCollection<"posts">("posts", ({ data }) => {
		const matchesLocale = normalizeLocale(data.lang) === lang;
		return (import.meta.env.PROD ? data.draft !== true : true) && matchesLocale;
	});

	const countMap: { [key: string]: number } = {};
	allBlogPosts.forEach((post: { data: { tags: string[] } }) => {
		post.data.tags.forEach((tag: string) => {
			if (!countMap[tag]) countMap[tag] = 0;
			countMap[tag]++;
		});
	});

	// sort tags
	const keys: string[] = Object.keys(countMap).sort((a, b) => {
		return a.toLowerCase().localeCompare(b.toLowerCase());
	});

	return keys.map((key) => ({ name: key, count: countMap[key] }));
}

export type Category = {
	name: string;
	count: number;
	url: string;
};

export async function getCategoryList(lang: SiteLocale = DEFAULT_LOCALE): Promise<Category[]> {
	const allBlogPosts = await getCollection<"posts">("posts", ({ data }) => {
		const matchesLocale = normalizeLocale(data.lang) === lang;
		return (import.meta.env.PROD ? data.draft !== true : true) && matchesLocale;
	});
	const count: { [key: string]: number } = {};
	allBlogPosts.forEach((post: { data: { category: string | null } }) => {
		if (!post.data.category) {
			const ucKey = i18n(I18nKey.uncategorized);
			count[ucKey] = count[ucKey] ? count[ucKey] + 1 : 1;
			return;
		}

		const categoryName =
			typeof post.data.category === "string"
				? post.data.category.trim()
				: String(post.data.category).trim();

		count[categoryName] = count[categoryName] ? count[categoryName] + 1 : 1;
	});

	const lst = Object.keys(count).sort((a, b) => {
		return a.toLowerCase().localeCompare(b.toLowerCase());
	});

	const ret: Category[] = [];
	for (const c of lst) {
		ret.push({
			name: c,
			count: count[c],
			url: getCategoryUrl(c, lang),
		});
	}
	return ret;
}

// Products utilities
export async function getSortedProducts(lang: SiteLocale = DEFAULT_LOCALE) {
	const allProducts = await getCollection("products", ({ data }) => {
		const matchesLocale = normalizeLocale(data.lang) === lang;
		return (import.meta.env.PROD ? data.draft !== true : true) && matchesLocale;
	});

	const sorted = allProducts.sort((a, b) => {
		const dateA = new Date(a.data.published);
		const dateB = new Date(b.data.published);
		return dateA > dateB ? -1 : 1;
	});
	return sorted;
}

export type ProductCategory = {
	name: string;
	count: number;
};

export async function getProductCategoryList(lang: SiteLocale = DEFAULT_LOCALE): Promise<ProductCategory[]> {
	const allProducts = await getCollection<"products">("products", ({ data }) => {
		const matchesLocale = normalizeLocale(data.lang) === lang;
		return (import.meta.env.PROD ? data.draft !== true : true) && matchesLocale;
	});
	const count: { [key: string]: number } = {};
	allProducts.forEach((product: { data: { category: string | null } }) => {
		if (!product.data.category) {
			const ucKey = i18n(I18nKey.uncategorized);
			count[ucKey] = count[ucKey] ? count[ucKey] + 1 : 1;
			return;
		}

		const categoryName =
			typeof product.data.category === "string"
				? product.data.category.trim()
				: String(product.data.category).trim();

		count[categoryName] = count[categoryName] ? count[categoryName] + 1 : 1;
	});

	const lst = Object.keys(count).sort((a, b) => {
		return a.toLowerCase().localeCompare(b.toLowerCase());
	});

	return lst.map((c) => ({
		name: c,
		count: count[c],
	}));
}

export async function getSpecEntryByTranslationKey(
	translationKey: string,
	lang: SiteLocale = DEFAULT_LOCALE,
) {
	const entries = await getCollection("spec", ({ data }) => {
		return normalizeLocale(data.lang) === lang && data.translationKey === translationKey;
	});
	return entries[0];
}
