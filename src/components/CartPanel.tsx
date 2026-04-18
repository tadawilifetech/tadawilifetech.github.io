import { useEffect, useState } from "react";
import { FaWhatsapp } from "react-icons/fa6";
import {
	MdAdd,
	MdClose,
	MdDeleteOutline,
	MdOutlineShoppingCart,
	MdRemove,
} from "react-icons/md";
import {
	buildCartWhatsAppMessage,
	clearCart,
	getCartCount,
	getCartItems,
	getCartTotal,
	onCartUpdated,
	removeCartItem,
	type CartItem,
	updateCartItemQuantity,
} from "@utils/cart";
import { buildWhatsAppUrl } from "@utils/contact";

const text = {
	en: {
		cart: "Cart",
		empty: "Your cart is empty.",
		lead: "Add products, then send the order to WhatsApp.",
		send: "Send to WhatsApp",
		clear: "Clear",
		total: "Estimated Total",
	},
	ar: {
		cart: "السلة",
		empty: "السلة فارغة.",
		lead: "أضف المنتجات ثم أرسل الطلب عبر واتساب.",
		send: "إرسال إلى واتساب",
		clear: "مسح",
		total: "الإجمالي التقديري",
	},
	fa: {
		cart: "سبد خرید",
		empty: "سبد خرید خالی است.",
		lead: "محصولات را اضافه کنید و سپس سفارش را در واتساپ ارسال کنید.",
		send: "ارسال به واتساپ",
		clear: "پاک کردن",
		total: "مجموع تقریبی",
	},
} as const;

interface Props {
	locale?: string;
}

export default function CartPanel({ locale = "en" }: Props) {
	const [items, setItems] = useState<CartItem[]>([]);
	const [open, setOpen] = useState(false);
	const ui = text[locale as keyof typeof text] ?? text.en;
	const total = getCartTotal(items);

	useEffect(() => {
		setItems(getCartItems());

		const unsubscribe = onCartUpdated((nextItems) => {
			setItems(nextItems);
		});

		const openHandler = () => setOpen(true);
		window.addEventListener("cart:open", openHandler);

		return () => {
			unsubscribe();
			window.removeEventListener("cart:open", openHandler);
		};
	}, []);

	function handleSend() {
		if (items.length === 0) return;
		const url = buildWhatsAppUrl(buildCartWhatsAppMessage(items, locale));
		window.open(url, "_blank", "noopener,noreferrer");
	}

	return (
		<div className="relative z-50">
			<button
				aria-label={ui.cart}
				className="btn-plain scale-animation rounded-lg h-11 w-11 active:scale-90"
				onClick={() => setOpen((value) => !value)}
				type="button"
			>
				<div className="relative">
					<MdOutlineShoppingCart className="text-[1.35rem]" aria-hidden="true" />
					{getCartCount(items) > 0 && (
						<span className="absolute -top-2 -right-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--primary)] px-1 text-[0.65rem] font-bold text-white">
							{getCartCount(items)}
						</span>
					)}
				</div>
			</button>

			<div
				className={`absolute top-12 ltr:right-0 rtl:left-0 w-[min(92vw,24rem)] transition ${
					open ? "" : "float-panel-closed pointer-events-none"
				}`}
			>
				<div className="card-base overflow-hidden border border-black/5 dark:border-white/10">
					<div className="flex items-center justify-between border-b border-black/5 px-4 py-3 dark:border-white/10">
						<div>
							<div className="font-bold text-90">{ui.cart}</div>
							<div className="text-xs text-50">{ui.lead}</div>
						</div>
						<button
							type="button"
							className="btn-plain rounded-lg h-9 w-9"
							onClick={() => setOpen(false)}
						>
							<MdClose className="text-[1.2rem]" aria-hidden="true" />
						</button>
					</div>

					{items.length === 0 ? (
						<div className="px-4 py-6 text-sm text-50">{ui.empty}</div>
					) : (
						<>
							<div className="max-h-[22rem] overflow-y-auto px-3 py-3">
								{items.map((item) => (
									<div
										key={item.id}
										className="mb-2 rounded-xl border border-black/5 px-3 py-3 last:mb-0 dark:border-white/10"
									>
										<div className="flex items-start justify-between gap-3">
											<div className="min-w-0">
												<a
													href={item.url}
													className="block truncate font-semibold text-90 hover:text-[var(--primary)]"
												>
													{item.title}
												</a>
												{item.price && (
													<div className="mt-1 text-sm text-[var(--primary)]">
														{item.price}
													</div>
												)}
											</div>
											<button
												type="button"
												className="btn-plain rounded-lg h-8 w-8 shrink-0"
												onClick={() => setItems(removeCartItem(item.id))}
											>
												<MdDeleteOutline aria-hidden="true" />
											</button>
										</div>
										<div className="mt-3 flex items-center gap-2">
											<button
												type="button"
												className="btn-regular rounded-lg h-8 w-8"
												onClick={() =>
													setItems(updateCartItemQuantity(item.id, item.quantity - 1))
												}
											>
												<MdRemove aria-hidden="true" />
											</button>
											<div className="min-w-8 text-center text-sm font-semibold text-90">
												{item.quantity}
											</div>
											<button
												type="button"
												className="btn-regular rounded-lg h-8 w-8"
												onClick={() =>
													setItems(updateCartItemQuantity(item.id, item.quantity + 1))
												}
											>
												<MdAdd aria-hidden="true" />
											</button>
										</div>
									</div>
								))}
							</div>
							<div className="border-t border-black/5 px-4 py-3 dark:border-white/10">
								<div className="mb-3 flex items-center justify-between rounded-xl bg-black/[0.03] px-3 py-2.5 dark:bg-white/[0.03]">
									<span className="text-sm font-medium text-50">{ui.total}</span>
									<span className="text-sm font-bold text-[var(--primary)]">
										{total.value !== null ? total.label : "-"}
									</span>
								</div>
								<div className="flex items-center gap-2">
									<button
										type="button"
										className="btn-regular flex-1 rounded-xl px-4 py-3 font-semibold"
										onClick={() => {
											clearCart();
											setItems([]);
										}}
									>
										{ui.clear}
									</button>
									<button
										type="button"
										className="flex-1 rounded-xl bg-[var(--primary)] px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 active:scale-[0.98]"
										onClick={handleSend}
									>
										<span className="inline-flex items-center justify-center gap-2 whitespace-nowrap">
											<FaWhatsapp aria-hidden="true" className="shrink-0" />
											{ui.send}
										</span>
									</button>
								</div>
							</div>
						</>
					)}
				</div>
			</div>
		</div>
	);
}
