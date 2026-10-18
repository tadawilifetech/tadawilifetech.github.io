import type { CollectionEntry } from "astro:content";
import type { SiteLocale } from "@utils/locale-utils";
import { getProductUrlBySlug } from "@utils/url-utils";

/** schema.org Product (+ FAQPage when the product has FAQs). */
export function buildProductJsonLd(
	entry: CollectionEntry<"products">,
	productKey: string,
	locale: SiteLocale,
	origin = "https://tadawilifetech.com",
) {
	const d = entry.data;
	const abs = (p: string) =>
		p.startsWith("http") ? p : `${origin}${p.startsWith("/") ? "" : "/"}${p}`;
	const priceValue = Number.parseFloat(d.price.replace(/[^\d.]/g, ""));
	const product = {
		"@type": "Product",
		name: d.title,
		description: d.description || d.title,
		image: [d.image, ...d.gallery].filter(Boolean).map(abs),
		url: `${origin}${getProductUrlBySlug(productKey, locale)}`,
		category: d.category || undefined,
		brand: { "@type": "Organization", name: "Tadawi Life Tech" },
		offers: Number.isFinite(priceValue)
			? {
					"@type": "Offer",
					price: priceValue,
					priceCurrency: "OMR",
					availability: "https://schema.org/InStock",
				}
			: undefined,
	};
	const graph: object[] = [product];
	if (d.faq.length) {
		graph.push({
			"@type": "FAQPage",
			mainEntity: d.faq.map((f) => ({
				"@type": "Question",
				name: f.q,
				acceptedAnswer: { "@type": "Answer", text: f.a },
			})),
		});
	}
	return { "@context": "https://schema.org", "@graph": graph };
}
