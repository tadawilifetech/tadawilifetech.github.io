import { defineCollection, z } from "astro:content";

const postsCollection = defineCollection({
	schema: z.object({
		title: z.string(),
		published: z.date(),
		updated: z.date().optional(),
		draft: z.boolean().optional().default(false),
		description: z.string().optional().default(""),
		image: z.string().optional().default(""),
		tags: z.array(z.string()).optional().default([]),
		category: z.string().optional().nullable().default(""),
		lang: z.string().optional().default(""),
		translationKey: z.string().optional().default(""),

		/* For internal use */
		prevTitle: z.string().default(""),
		prevSlug: z.string().default(""),
		nextTitle: z.string().default(""),
		nextSlug: z.string().default(""),
	}),
});

const productVideo = z.object({
	title: z.string().optional().default(""),
	/** YouTube video id or URL. Played inside the branded, link-free player. */
	youtube: z.string().optional().default(""),
	/** Self-hosted video file under /public. */
	src: z.string().optional().default(""),
	poster: z.string().optional().default(""),
	/** Stop playback at this second (used to cut trailing third-party branding). */
	end: z.number().optional(),
});

const productsCollection = defineCollection({
	schema: z.object({
		title: z.string(),
		published: z.date(),
		updated: z.date().optional(),
		draft: z.boolean().optional().default(false),
		description: z.string().optional().default(""),
		image: z.string().optional().default(""),
		price: z.string().optional().default(""),
		category: z.string().optional().nullable().default(""),
		tags: z.array(z.string()).optional().default([]),
		lang: z.string().optional().default(""),
		translationKey: z.string().optional().default(""),

		/** Top-level product family shown as the two home page tabs. */
		group: z.enum(["sleep", "orthopedic"]).optional().default("sleep"),
		/** Orthopedic sub-family: back-spine | knee | foot-ankle | hand-wrist. */
		subcategory: z.string().optional().default(""),
		/** Sort order inside a category (lower first). */
		order: z.number().optional().default(100),
		gallery: z.array(z.string()).optional().default([]),
		/** Video played when the main product image is clicked. */
		imageVideo: z.string().optional().default(""),
		/** Videos shown before the product description. */
		videos: z.array(productVideo).optional().default([]),
		downloads: z
			.array(
				z.object({
					group: z.string().optional().default(""),
					label: z.string(),
					file: z.string(),
				}),
			)
			.optional()
			.default([]),
		sizes: z
			.array(z.object({ size: z.string(), range: z.string() }))
			.optional()
			.default([]),
		sizeLabel: z.string().optional().default(""),
		faq: z
			.array(z.object({ q: z.string(), a: z.string() }))
			.optional()
			.default([]),
	}),
});

const specCollection = defineCollection({
	schema: z.object({
		lang: z.string().optional().default(""),
		translationKey: z.string().optional().default(""),
	}),
});
export const collections = {
	posts: postsCollection,
	products: productsCollection,
	spec: specCollection,
};
