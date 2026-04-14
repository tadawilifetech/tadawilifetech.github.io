import * as React from "react";
import * as ReactDOM from "react-dom";

declare global {
	interface Window {
		DecapCmsApp?: {
			init?: () => void;
		};
		React?: typeof React;
		ReactDOM?: typeof ReactDOM;
	}
}

const siteHref = document.body.dataset.siteHref || "/en/";
const siteUrl = new URL(siteHref, window.location.origin).toString();
const repoUrl = "https://github.com/tadawilifetech/tadawilifetech.github.io";
const cmsBundleUrl = document.body.dataset.cmsBundleUrl;

async function loadScript(src: string) {
	await new Promise<void>((resolve, reject) => {
		const existing = document.querySelector(`script[data-cms-bundle=\"${src}\"]`);
		if (existing instanceof HTMLScriptElement) {
			if (existing.dataset.loaded === "true") {
				resolve();
				return;
			}
			existing.addEventListener("load", () => resolve(), { once: true });
			existing.addEventListener("error", () => reject(new Error(`Failed to load ${src}`)), { once: true });
			return;
		}

		const script = document.createElement("script");
		script.src = src;
		script.async = true;
		script.dataset.cmsBundle = src;
		script.addEventListener(
			"load",
			() => {
				script.dataset.loaded = "true";
				resolve();
			},
			{ once: true },
		);
		script.addEventListener("error", () => reject(new Error(`Failed to load ${src}`)), { once: true });
		document.head.append(script);
	});
}

function updateSiteLinks() {
	const anchors = document.querySelectorAll("a[href]");
	for (const anchor of anchors) {
		if (!(anchor instanceof HTMLAnchorElement)) continue;
		const href = anchor.href;
		const text = anchor.textContent?.trim().toLowerCase() ?? "";
		const isBackLink = text === "go back to site";
		const isRepoLink = href === repoUrl || href.startsWith(`${repoUrl}/`);
		if (isBackLink || isRepoLink) {
			anchor.href = siteUrl;
			anchor.target = "_blank";
			anchor.rel = "noopener noreferrer";
			if (isRepoLink) {
				anchor.textContent = "View site";
			}
		}
	}
}

function cleanUI() {
	const auth = document.querySelector('[class*="exus10f5"]');
	updateSiteLinks();
	if (!(auth instanceof HTMLElement)) {
		document.body.classList.remove("auth");
		return;
	}

	document.body.classList.add("auth");
	let current: HTMLElement | null = auth;
	while (current && current !== document.body) {
		const container: HTMLElement | null = current.parentElement;
		if (!container) break;

		for (const sibling of container.children) {
			if (sibling !== current && !["SCRIPT", "STYLE", "NOSCRIPT"].includes(sibling.tagName) && sibling instanceof HTMLElement) {
				sibling.style.display = "none";
			}
		}

		if (container === document.body) break;

		container.style.background = "transparent";
		container.style.boxShadow = "none";
		container.style.border = "none";
		container.style.padding = "0";
		container.style.minHeight = "0";
		current = container;
	}
}

async function boot() {
	new MutationObserver(cleanUI).observe(document.body, { childList: true, subtree: true });

	window.React = React;
	window.ReactDOM = ReactDOM;

	if (!cmsBundleUrl) {
		throw new Error("Decap CMS bundle URL is missing.");
	}

	await loadScript(cmsBundleUrl);

	const CMS = window.DecapCmsApp;
	if (!CMS?.init) {
		throw new Error("Decap CMS bundle did not expose an init function.");
	}

	CMS.init();
	cleanUI();
}

void boot();