export const SUPPORTED_LOCALES = ["en", "ar", "fa"] as const;

export type SiteLocale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: SiteLocale = "en";

export function isSupportedLocale(value: string | undefined | null): value is SiteLocale {
	return SUPPORTED_LOCALES.includes((value || "") as SiteLocale);
}

export function normalizeLocale(value: string | undefined | null): SiteLocale {
	return isSupportedLocale(value) ? value : DEFAULT_LOCALE;
}

export function getLocaleFromPathname(pathname: string): SiteLocale {
	const firstSegment = pathname.split("/").filter(Boolean)[0];
	return normalizeLocale(firstSegment);
}

export function getExplicitLocaleFromPathname(pathname: string): SiteLocale | null {
	const firstSegment = pathname.split("/").filter(Boolean)[0];
	return isSupportedLocale(firstSegment) ? firstSegment : null;
}

export function stripLocaleFromPathname(pathname: string): string {
	const segments = pathname.split("/").filter(Boolean);
	if (segments.length > 0 && isSupportedLocale(segments[0])) {
		segments.shift();
	}
	return `/${segments.join("/")}${pathname.endsWith("/") || segments.length === 0 ? "/" : ""}`;
}

export function localizePath(path: string, locale: SiteLocale): string {
	const [pathAndQuery, hash = ""] = path.split("#");
	const [pathname, query = ""] = pathAndQuery.split("?");
	const normalizedPath = pathname.replace(/^\/+|\/+$/g, "");
	const localizedPath = normalizedPath ? `/${locale}/${normalizedPath}/` : `/${locale}/`;
	const result = localizedPath.replace(/\/+/g, "/");
	const withQuery = query ? `${result}?${query}` : result;
	return hash ? `${withQuery}#${hash}` : withQuery;
}

export function switchLocaleInPath(path: string, locale: SiteLocale): string {
	return localizePath(stripLocaleFromPathname(path), locale);
}

export function getEntryTranslationKey(
	entry: { slug: string; data: { translationKey?: string; lang?: string } },
): string {
	if (entry.data.translationKey && entry.data.translationKey.trim() !== "") {
		return entry.data.translationKey.trim();
	}

	const normalizedLocale = normalizeLocale(entry.data.lang);
	if (normalizedLocale === DEFAULT_LOCALE) {
		return entry.slug;
	}

	return entry.slug
		.replace(new RegExp(`([.-])${normalizedLocale}$`), "")
		.replace(/\/index$/, "");
}