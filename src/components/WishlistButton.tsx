import { useEffect, useState } from "react";
import { isInWishlist, toggleWishlist } from "@utils/wishlist";

interface Props {
	id: string;
	size?: "sm" | "md";
}

export default function WishlistButton({ id, size = "sm" }: Props) {
	const [active, setActive] = useState(false);
	const [pop, setPop] = useState(false);

	useEffect(() => {
		setActive(isInWishlist(id));
		const handler = () => setActive(isInWishlist(id));
		window.addEventListener("wishlist:updated", handler);
		return () => window.removeEventListener("wishlist:updated", handler);
	}, [id]);

	function handleClick(e: React.MouseEvent) {
		e.preventDefault();
		e.stopPropagation();
		const nowActive = toggleWishlist(id);
		setActive(nowActive);
		if (nowActive) {
			setPop(true);
			setTimeout(() => setPop(false), 400);
		}
	}

	const dim = size === "md" ? "w-9 h-9" : "w-7 h-7";
	const iconSize = size === "md" ? "w-5 h-5" : "w-4 h-4";

	return (
		<button
			type="button"
			onClick={handleClick}
			aria-label="Toggle wishlist"
			className={`${dim} inline-flex items-center justify-center rounded-full transition-all duration-200 
				${active
					? "bg-pink-50 dark:bg-pink-950/40"
					: "bg-black/5 dark:bg-white/10 hover:bg-pink-50 dark:hover:bg-pink-950/40"
				}
				${pop ? "scale-125" : "scale-100"}
			`}
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				viewBox="0 0 24 24"
				className={`${iconSize} transition-all duration-200 ${
					active
						? "fill-rose-500 stroke-rose-500"
						: "fill-none stroke-black/30 dark:stroke-white/30 hover:stroke-rose-400"
				}`}
				strokeWidth={2}
			>
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"
				/>
			</svg>
		</button>
	);
}
