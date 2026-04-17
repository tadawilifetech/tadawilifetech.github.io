import * as React from "react";
import * as ReactDOM from "react-dom";

type ReactInternals = {
	A?: {
		getOwner?: () => unknown;
	};
	S?: unknown;
};

type ReactWithInternals = typeof React & {
	__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE?: ReactInternals;
	createElement: typeof React.createElement & {
		__decapPatched?: boolean;
	};
};

declare global {
	interface Window {
		DecapCmsApp?: {
			init?: () => void;
		};
		React?: typeof React;
		ReactDOM?: typeof ReactDOM;
	}
}

function createPatchedReact(): typeof React {
	// ESM namespace objects are frozen in production builds, so we must
	// create a mutable shallow copy before patching anything.
	const mutableReact: Record<string, unknown> = { ...React };

	const reactInternals = (mutableReact as unknown as ReactWithInternals)
		.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;

	if (!reactInternals) return mutableReact as unknown as typeof React;

	const patchDispatcher = () => {
		reactInternals.A ??= {};
		reactInternals.A.getOwner ??= () => null;
	};

	patchDispatcher();
	reactInternals.S ??= null;

	const originalCreateElement = React.createElement;
	const patchedCreateElement = ((...args: Parameters<typeof React.createElement>) => {
		patchDispatcher();
		return originalCreateElement(...args);
	}) as ReactWithInternals["createElement"];

	patchedCreateElement.__decapPatched = true;
	mutableReact.createElement = patchedCreateElement;

	return mutableReact as unknown as typeof React;
}

const siteHref = document.body.dataset.siteHref || "/en/";
const siteUrl = new URL(siteHref, window.location.origin).toString();
const repoUrl = "https://github.com/tadawilifetech/tadawilifetech.github.io";
const cmsBundleUrl = document.body.dataset.cmsBundleUrl;
const hiddenElements = new Map<HTMLElement, string>();
const restyledContainers = new Map<HTMLElement, Pick<CSSStyleDeclaration, "background" | "boxShadow" | "border" | "padding" | "minHeight">>();

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

function restoreAuthUI() {
	for (const [element, display] of hiddenElements) {
		element.style.display = display;
	}
	hiddenElements.clear();

	for (const [element, styles] of restyledContainers) {
		element.style.background = styles.background;
		element.style.boxShadow = styles.boxShadow;
		element.style.border = styles.border;
		element.style.padding = styles.padding;
		element.style.minHeight = styles.minHeight;
	}
	restyledContainers.clear();
}

function cleanUI() {
	const auth = document.querySelector('[class*="exus10f5"]');
	updateSiteLinks();
	if (!(auth instanceof HTMLElement)) {
		document.body.classList.remove("auth");
		restoreAuthUI();
		return;
	}

	document.body.classList.add("auth");
	let current: HTMLElement | null = auth;
	while (current && current !== document.body) {
		const container: HTMLElement | null = current.parentElement;
		if (!container) break;

		for (const sibling of container.children) {
			if (sibling !== current && !["SCRIPT", "STYLE", "NOSCRIPT"].includes(sibling.tagName) && sibling instanceof HTMLElement) {
				if (!hiddenElements.has(sibling)) {
					hiddenElements.set(sibling, sibling.style.display);
				}
				sibling.style.display = "none";
			}
		}

		if (container === document.body) break;

		if (!restyledContainers.has(container)) {
			restyledContainers.set(container, {
				background: container.style.background,
				boxShadow: container.style.boxShadow,
				border: container.style.border,
				padding: container.style.padding,
				minHeight: container.style.minHeight,
			});
		}
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

	window.React = createPatchedReact();
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