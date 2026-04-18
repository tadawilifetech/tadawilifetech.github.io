import { useState } from "react";
import { FaWhatsapp } from "react-icons/fa6";
import { MdOutlineShoppingCart } from "react-icons/md";
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
		lead: "Add this item to the cart and send your order to WhatsApp when ready.",
		add: "Add to Cart",
		added: "Added to Cart",
	},
	ar: {
		title: "اطلب هذا المنتج",
		lead: "أضف هذا المنتج إلى السلة ثم أرسل الطلب عبر واتساب عندما تكون جاهزًا.",
		add: "أضف إلى السلة",
		added: "تمت الإضافة",
	},
	fa: {
		title: "سفارش این محصول",
		lead: "این محصول را به سبد اضافه کنید و هر زمان آماده بودید سفارش را از طریق واتساپ بفرستید.",
		add: "افزودن به سبد",
		added: "به سبد اضافه شد",
	},
} as const;

export default function AddToCartButton({
	id,
	title,
	price,
	url,
	locale = "en",
}: Props) {
	const [added, setAdded] = useState(false);
	const ui = text[locale as keyof typeof text] ?? text.en;

	function handleAdd() {
		addCartItem({ id, title, price, url });
		window.dispatchEvent(new CustomEvent("cart:open"));
		setAdded(true);
		window.setTimeout(() => setAdded(false), 1800);
	}

	return (
		<div className="card-base mt-8 p-5 md:p-6 onload-animation">
			<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
				<div>
					<h2 className="text-xl font-bold text-90">{ui.title}</h2>
					<p className="mt-1 text-sm text-50">{ui.lead}</p>
				</div>
				<button
					type="button"
					onClick={handleAdd}
					className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-6 py-3 font-semibold text-white transition hover:opacity-90 active:scale-[0.98]"
				>
					{added ? (
						<FaWhatsapp className="text-[1.1rem]" aria-hidden="true" />
					) : (
						<MdOutlineShoppingCart className="text-[1.3rem]" aria-hidden="true" />
					)}
					<span>{added ? ui.added : ui.add}</span>
				</button>
			</div>
		</div>
	);
}
