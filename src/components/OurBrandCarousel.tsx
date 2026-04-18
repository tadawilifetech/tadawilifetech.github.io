import type { CSSProperties } from "react";
import useEmblaCarousel from "embla-carousel-react";

interface Props {
	className?: string;
	animationDelay?: string;
}

const brands = [
	{ name: "Aeonmed", src: "/our-brand/Aeonmed.png" },
	{ name: "Heyer", src: "/our-brand/Heyer.png" },
	{ name: "Medcodes", src: "/our-brand/Medcodes.png" },
	{ name: "MT Medical", src: "/our-brand/MT-Medical.jpg" },
	{ name: "Oniris", src: "/our-brand/Oniris.jpg" },
	{ name: "Ortino", src: "/our-brand/Ortino.jpeg" },
	{ name: "Waterpulse", src: "/our-brand/Waterpulse.jpg" },
	{ name: "Zeus", src: "/our-brand/Zeus.png" },
];

export default function OurBrandCarousel({
	className = "",
	animationDelay,
}: Props) {
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
					<p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--primary)]">
						Our Brand
					</p>
					<h2 className="mt-2 text-2xl md:text-3xl font-bold text-90">
						Trusted Brands We Work With
					</h2>
				</div>
			</div>

			<div className="overflow-hidden cursor-grab active:cursor-grabbing touch-pan-y" ref={emblaRef}>
				<div className="-ml-4 flex">
					{brands.map((brand) => (
						<div
							key={brand.name}
							className="min-w-0 shrink-0 basis-[78%] pl-4 sm:basis-[42%] lg:basis-[30%] xl:basis-[22%]"
						>
							<div className="group relative flex h-28 md:h-32 items-center justify-center rounded-[var(--radius-large)] border border-black/5 bg-white px-6 py-5 transition hover:border-[var(--primary)]/25 hover:-translate-y-1 dark:border-white/10 dark:bg-white/[0.03]">
								<img
									src={brand.src}
									alt={brand.name}
									loading="lazy"
									className="max-h-full w-auto max-w-full object-contain select-none pointer-events-none"
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
