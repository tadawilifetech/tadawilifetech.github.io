export type CartItem = {
	id: string;
	title: string;
	price?: string;
	url: string;
	quantity: number;
};

type OrderLocale = "en" | "ar" | "fa";

const CART_STORAGE_KEY = "shopping-cart";
const CART_UPDATED_EVENT = "cart:updated";

function isBrowser(): boolean {
	return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

export function getCartItems(): CartItem[] {
	if (!isBrowser()) return [];

	try {
		const raw = localStorage.getItem(CART_STORAGE_KEY);
		if (!raw) return [];
		const parsed = JSON.parse(raw) as CartItem[];
		return Array.isArray(parsed) ? parsed : [];
	} catch {
		return [];
	}
}

function saveCartItems(items: CartItem[]): void {
	if (!isBrowser()) return;
	localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
	window.dispatchEvent(new CustomEvent(CART_UPDATED_EVENT, { detail: items }));
}

export function addCartItem(item: Omit<CartItem, "quantity">): CartItem[] {
	const items = getCartItems();
	const existingItem = items.find((entry) => entry.id === item.id);

	if (existingItem) {
		existingItem.quantity += 1;
	} else {
		items.push({ ...item, quantity: 1 });
	}

	saveCartItems(items);
	return items;
}

export function updateCartItemQuantity(id: string, quantity: number): CartItem[] {
	const items = getCartItems()
		.map((item) => (item.id === id ? { ...item, quantity } : item))
		.filter((item) => item.quantity > 0);

	saveCartItems(items);
	return items;
}

export function removeCartItem(id: string): CartItem[] {
	const items = getCartItems().filter((item) => item.id !== id);
	saveCartItems(items);
	return items;
}

export function clearCart(): void {
	saveCartItems([]);
}

export function getCartCount(items: CartItem[] = getCartItems()): number {
	return items.reduce((total, item) => total + item.quantity, 0);
}

function parsePriceValue(price?: string): number | null {
	if (!price) return null;
	const normalized = price.replace(/,/g, "");
	const match = normalized.match(/-?\d+(?:\.\d+)?/);
	if (!match) return null;
	const value = Number.parseFloat(match[0]);
	return Number.isFinite(value) ? value : null;
}

function detectCurrencyLabel(items: CartItem[]): string {
	const price = items.find((item) => item.price)?.price;
	if (!price) return "";
	const cleaned = price.replace(/[\d\s,.-]/g, "").trim();
	return cleaned;
}

export function getCartTotal(items: CartItem[]): {
	value: number | null;
	label: string;
} {
	const values = items
		.map((item) => {
			const priceValue = parsePriceValue(item.price);
			if (priceValue === null) return null;
			return priceValue * item.quantity;
		})
		.filter((value): value is number => value !== null);

	if (values.length !== items.filter((item) => item.price).length) {
		return { value: null, label: "" };
	}

	const total = values.reduce((sum, value) => sum + value, 0);
	const currency = detectCurrencyLabel(items);
	return {
		value: total,
		label: currency ? `${total.toFixed(2)} ${currency}` : total.toFixed(2),
	};
}

export function buildCartWhatsAppMessage(
	items: CartItem[],
	locale: string = "en",
): string {
	const normalizedLocale: OrderLocale =
		locale === "ar" || locale === "fa" ? locale : "en";
	const total = getCartTotal(items);
	const labels = {
		en: {
			qty: "Qty",
			unitPrice: "Unit Price",
			lineTotal: "Line Total",
			link: "Link",
		},
		ar: {
			qty: "الكمية",
			unitPrice: "سعر الوحدة",
			lineTotal: "إجمالي الصنف",
			link: "الرابط",
		},
		fa: {
			qty: "تعداد",
			unitPrice: "قیمت واحد",
			lineTotal: "جمع آیتم",
			link: "لینک",
		},
	}[normalizedLocale];
	const lines = items.flatMap((item, index) => {
		const base = [`${index + 1}. ${item.title}`, `   ${labels.qty}: ${item.quantity}`];

		if (item.price) {
			base.push(`   ${labels.unitPrice}: ${item.price}`);
		}

		const itemTotal = parsePriceValue(item.price);
		if (itemTotal !== null) {
			const currency = detectCurrencyLabel([item]);
			base.push(
				`   ${labels.lineTotal}: ${(itemTotal * item.quantity).toFixed(2)}${currency ? ` ${currency}` : ""}`,
			);
		}

		base.push(`   ${labels.link}: ${window.location.origin}${item.url}`);
		return base;
	});

	const messages: Record<OrderLocale, string[]> = {
		en: [
			"Hello,",
			"",
			"I would like to place an order. Please find my requested items below:",
			"",
			"*Order Details*",
			...lines,
			"",
			`*Total Items:* ${getCartCount(items)}`,
			...(total.value !== null ? [`*Estimated Total:* ${total.label}`] : []),
			"",
			"Please review the order and contact me to proceed with confirmation, availability, and payment.",
			"Thank you.",
		],
		ar: [
			"السلام عليكم،",
			"",
			"أرغب في تقديم طلب، وتفاصيل المنتجات المطلوبة موضحة أدناه:",
			"",
			"*تفاصيل الطلب*",
			...lines,
			"",
			`*إجمالي القطع:* ${getCartCount(items)}`,
			...(total.value !== null ? [`*الإجمالي التقديري:* ${total.label}`] : []),
			"",
			"يرجى مراجعة الطلب والتواصل معي لاستكمال التأكيد والتوفر وطريقة الدفع.",
			"شاكرًا لكم.",
		],
		fa: [
			"سلام و وقت بخیر،",
			"",
			"مایلم این سفارش را ثبت کنم. جزئیات محصولات مورد نظر من به شرح زیر است:",
			"",
			"*جزئیات سفارش*",
			...lines,
			"",
			`*تعداد کل اقلام:* ${getCartCount(items)}`,
			...(total.value !== null ? [`*مجموع تقریبی:* ${total.label}`] : []),
			"",
			"لطفاً سفارش را بررسی فرمایید و برای ادامه فرایند تایید، موجودی و پرداخت با من در تماس باشید.",
			"سپاسگزارم.",
		],
	};

	return messages[normalizedLocale].join("\n");
}

export function onCartUpdated(callback: (items: CartItem[]) => void): () => void {
	if (!isBrowser()) return () => undefined;

	const handler = (event: Event) => {
		const customEvent = event as CustomEvent<CartItem[]>;
		callback(customEvent.detail ?? getCartItems());
	};
	const storageHandler = () => callback(getCartItems());

	window.addEventListener(CART_UPDATED_EVENT, handler);
	window.addEventListener("storage", storageHandler);

	return () => {
		window.removeEventListener(CART_UPDATED_EVENT, handler);
		window.removeEventListener("storage", storageHandler);
	};
}
