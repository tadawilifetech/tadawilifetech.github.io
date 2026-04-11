import { rtlLanguages, supportedLanguages } from "@i18n/translation";

const LANG_STORAGE_KEY = "lang";
const DEFAULT_LANG = "en";

export function getStoredLang(): string {
	if (typeof localStorage === "undefined") return DEFAULT_LANG;
	return localStorage.getItem(LANG_STORAGE_KEY) || DEFAULT_LANG;
}

export function setStoredLang(lang: string): void {
	localStorage.setItem(LANG_STORAGE_KEY, lang);
}

export function isRtl(lang: string): boolean {
	return rtlLanguages.includes(lang);
}

export function getDirection(lang: string): "ltr" | "rtl" {
	return isRtl(lang) ? "rtl" : "ltr";
}

export function getSupportedLanguages() {
	return supportedLanguages;
}

/**
 * Apply language direction and lang attribute to the document.
 * Also applies the RTL/LTR body class for CSS hooks.
 */
export function applyLangToDocument(lang: string): void {
	const dir = getDirection(lang);
	document.documentElement.lang = lang;
	document.documentElement.dir = dir;
	document.body.classList.toggle("is-rtl", dir === "rtl");
	document.body.classList.toggle("is-ltr", dir === "ltr");
}

/**
 * Update all elements with data-i18n attribute using the translations object.
 */
export function applyTranslations(
	lang: string,
	translations: Record<string, Record<string, string>>,
): void {
	const t = translations[lang] || translations[DEFAULT_LANG];
	if (!t) return;

	document.querySelectorAll("[data-i18n]").forEach((el) => {
		const key = el.getAttribute("data-i18n");
		if (key && t[key]) {
			el.textContent = t[key];
		}
	});

	// Update placeholder attributes
	document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
		const key = el.getAttribute("data-i18n-placeholder");
		if (key && t[key]) {
			(el as HTMLInputElement).placeholder = t[key];
		}
	});
}
