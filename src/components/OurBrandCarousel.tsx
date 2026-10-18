import useEmblaCarousel from "embla-carousel-react";
import type { CSSProperties } from "react";

interface Props {
	className?: string;
	animationDelay?: string;
	locale?: "en" | "ar" | "fa";
}

const heading = {
	en: { eyebrow: "Our brands", title: "Trusted brands we work with" },
	ar: { eyebrow: "علاماتنا التجارية", title: "علامات موثوقة نتعامل معها" },
	fa: {
		eyebrow: "برندهای ما",
		title: "برندهای معتبری که با آن‌ها همکاری می‌کنیم",
	},
};

const brands = [
	{ name: "Aeonmed", src: "/our-brand/Aeonmed.png" },
	{ name: "Heyer", src: "/our-brand/Heyer.png" },
	{ name: "Medcodes", src: "/our-brand/Medcodes.png" },
	// darkInk: logo colours are too dark for the dark theme, so they are inverted there.
	{ name: "MT Medical", src: "/our-brand/MT-Medical.png", darkInk: true },
	{ name: "Oniris", src: "/our-brand/Oniris.png", darkInk: true },
	{ name: "Ortino", src: "/our-brand/Ortino.png" },
	{ name: "Waterpulse", src: "/our-brand/Waterpulse.png", darkInk: true },
	{ name: "Zeus", src: "/our-brand/Zeus.png" },
];

export default function OurBrandCarousel({
	className = "",
	animationDelay,
	locale = "en",
}: Props) {
	const t = heading[locale] ?? heading.en;
	const [emblaRef] = useEmblaCarousel({
		align: "start",
		dragFree: true,
		loop: true,
	});

	return (
		<section
			className={`card-base overflow-hidden p-5 md:p-7 ${className}`}
			style={{ animationDelay } satisfies CSSProperties}
		>
			<div className="mb-5 md:mb-6 flex items-end justify-between gap-4">
				<div>
					<p className="section-eyebrow">{t.eyebrow}</p>
					<h2 className="section-title mt-2">{t.title}</h2>
				</div>
			</div>

			<div
				className="overflow-hidden cursor-grab active:cursor-grabbing touch-pan-y"
				ref={emblaRef}
			>
				<div className="-ml-4 flex">
					{brands.map((brand) => (
						<div
							key={brand.name}
							className="min-w-0 shrink-0 basis-[78%] pl-4 sm:basis-[42%] lg:basis-[30%] xl:basis-[22%]"
						>
							<div className="brand-tile relative flex h-28 md:h-32 items-center justify-center rounded-[var(--radius-large)] px-6 py-5">
								<img
									src={brand.src}
									alt={brand.name}
									loading="lazy"
									className={`brand-logo ${"darkInk" in brand ? "brand-logo--ink" : ""} max-h-full w-auto max-w-full object-contain select-none pointer-events-none`}
									draggable={false}
								/>
							</div>
							<div className="pt-3 text-center text-sm font-medium text-50">
								{brand.name}
							</div>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}
