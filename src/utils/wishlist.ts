const WISHLIST_KEY = "wishlist";
const WISHLIST_EVENT = "wishlist:updated";

function isBrowser(): boolean {
	return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

export function getWishlist(): string[] {
	if (!isBrowser()) return [];
	try {
		const raw = localStorage.getItem(WISHLIST_KEY);
		if (!raw) return [];
		const parsed = JSON.parse(raw) as string[];
		return Array.isArray(parsed) ? parsed : [];
	} catch {
		return [];
	}
}

function saveWishlist(ids: string[]): void {
	localStorage.setItem(WISHLIST_KEY, JSON.stringify(ids));
	window.dispatchEvent(new CustomEvent(WISHLIST_EVENT));
}

export function isInWishlist(id: string): boolean {
	return getWishlist().includes(id);
}

export function toggleWishlist(id: string): boolean {
	const list = getWishlist();
	const index = list.indexOf(id);
	if (index === -1) {
		list.push(id);
		saveWishlist(list);
		return true;
	}
	list.splice(index, 1);
	saveWishlist(list);
	return false;
}
