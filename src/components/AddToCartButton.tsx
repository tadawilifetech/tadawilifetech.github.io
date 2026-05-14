import { useState } from "react";
import { FaWhatsapp } from "react-icons/fa6";
import { MdOutlineShoppingCart, MdCheckCircleOutline } from "react-icons/md";
import { addCartItem } from "@utils/cart";

interface Props {
	id: string;
	title: string;
	price?: string;
	url: string;
	locale?: string;
}

const text = {
	en: {
		title: "Order This Product",
		lead: "Add to cart and complete your order via WhatsApp.",
		add: "Add to Cart",
		added: "Added!",
		badge: "Fast Delivery",
		secure: "Secure Order",
	},
	ar: {
		title: "اطلب هذا المنتج",
		lead: "أضف إلى السلة وأكمل طلبك عبر واتساب.",
		add: "أضف إلى السلة",
		added: "تمت الإضافة!",
		badge: "توصيل سريع",
		secure: "طلب آمن",
	},
	fa: {
		title: "سفارش این محصول",
		lead: "به سبد اضافه کنید و سفارشتان را از طریق واتساپ تکمیل کنید.",
		add: "افزودن به سبد",
		added: "اضافه شد!",
		badge: "ارسال سریع",
		secure: "سفارش امن",
	},
} as const;

export default function AddToCartButton({ id, title, price, url, locale = "en" }: Props) {
	const [added, setAdded] = useState(false);
	const ui = text[locale as keyof typeof text] ?? text.en;

	function handleAdd() {
		addCartItem({ id, title, price, url });
		window.dispatchEvent(new CustomEvent("cart:open"));
		setAdded(true);
		window.setTimeout(() => setAdded(false), 2200);
	}

	return (
		<div
			className="relative overflow-hidden rounded-[var(--radius-large)] onload-animation"
			style={{
				background: "linear-gradient(135deg, oklch(0.22 0.02 var(--hue)) 0%, oklch(0.18 0.03 var(--hue)) 100%)",
			}}
		>
			{/* Decorative glow */}
			<div
				className="absolute -top-16 -end-16 w-48 h-48 rounded-full pointer-events-none"
				style={{ background: "oklch(0.70 0.18 var(--hue))", opacity: 0.12, filter: "blur(40px)" }}
			/>
			<div
				className="absolute -bottom-12 -start-12 w-36 h-36 rounded-full pointer-events-none"
				style={{ background: "oklch(0.65 0.20 var(--hue))", opacity: 0.10, filter: "blur(32px)" }}
			/>

			<div className="relative z-10 p-6 md:p-7">
				{/* Header row */}
				<div className="flex items-start justify-between gap-4 mb-5">
					<div>
						<h2 className="text-lg font-bold text-white mb-1">{ui.title}</h2>
						<p className="text-sm text-white/60">{ui.lead}</p>
					</div>
					{/* Trust badges */}
					<div className="hidden sm:flex flex-col gap-1.5 shrink-0">
						<span className="inline-flex items-center gap-1.5 text-xs font-medium text-white/70 bg-white/10 rounded-full px-2.5 py-1">
							<FaWhatsapp className="text-green-400" />
							{ui.badge}
						</span>
						<span className="inline-flex items-center gap-1.5 text-xs font-medium text-white/70 bg-white/10 rounded-full px-2.5 py-1">
							<span className="text-[0.6rem]">🔒</span>
							{ui.secure}
						</span>
					</div>
				</div>

				{/* Price + CTA */}
				<div className="flex items-center gap-3">
					{price && (
						<div className="flex-1 min-w-0">
							<p className="text-2xl font-bold text-white truncate">{price}</p>
						</div>
					)}
					<button
						type="button"
						onClick={handleAdd}
						className={[
							"relative inline-flex items-center justify-center gap-2.5 rounded-xl px-6 py-3.5 font-semibold text-sm transition-all duration-200",
							"shadow-lg shadow-black/30 active:scale-[0.97]",
							added
								? "bg-green-500 text-white"
								: "bg-white text-[oklch(0.25_0.03_var(--hue))] hover:bg-white/90",
						].join(" ")}
					>
						{/* Ripple on add */}
						{added && (
							<span
								className="absolute inset-0 rounded-xl animate-ping opacity-30 bg-green-400"
								style={{ animationIterationCount: 1 }}
							/>
						)}
						{added ? (
							<MdCheckCircleOutline className="text-[1.25rem] shrink-0" aria-hidden />
						) : (
							<MdOutlineShoppingCart className="text-[1.25rem] shrink-0" aria-hidden />
						)}
						<span className="whitespace-nowrap">{added ? ui.added : ui.add}</span>
					</button>
				</div>
			</div>
		</div>
	);
}
