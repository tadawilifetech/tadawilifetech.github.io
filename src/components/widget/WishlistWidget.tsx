import { useEffect, useState } from "react";
import { getWishlist, toggleWishlist } from "@utils/wishlist";

export interface WishlistProduct {
	id: string;
	title: string;
	url: string;
}

interface Props {
	products: WishlistProduct[];
	emptyText: string;
}

export default function WishlistWidget({ products, emptyText }: Props) {
	const [wishlistIds, setWishlistIds] = useState<string[]>([]);

	useEffect(() => {
		setWishlistIds(getWishlist());
		const handler = () => setWishlistIds(getWishlist());
		window.addEventListener("wishlist:updated", handler);
		return () => window.removeEventListener("wishlist:updated", handler);
	}, []);

	const items = products.filter((p) => wishlistIds.includes(p.id));

	if (items.length === 0) {
		return (
			<div className="text-sm text-black/30 dark:text-white/30 px-1">
				{emptyText}
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-1">
			{items.map((item) => (
				<div key={item.id} className="group flex items-center gap-2">
					<a
						href={item.url}
						className="flex-1 text-sm py-1.5 px-2 rounded-lg transition-colors
							text-neutral-700 dark:text-neutral-300
							hover:bg-[var(--btn-plain-bg-hover)] active:bg-[var(--btn-plain-bg-active)]
							truncate"
					>
						{item.title}
					</a>
					<button
						type="button"
						onClick={() => toggleWishlist(item.id)}
						className="opacity-0 group-hover:opacity-100 transition-opacity
							w-6 h-6 flex-shrink-0 inline-flex items-center justify-center rounded-full
							text-black/30 dark:text-white/30 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40"
						aria-label="Remove from wishlist"
					>
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
							<path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
						</svg>
					</button>
				</div>
			))}
		</div>
	);
}
