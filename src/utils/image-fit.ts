import path from "node:path";
import sharp from "sharp";

export interface ImageFit {
	/** "contain" when the photo sits on a plain studio backdrop, "cover" for full scenes */
	fit: "contain" | "cover";
	/** Backdrop color sampled from the image edges, used to fill the frame seamlessly */
	bg: string;
}

const cache = new Map<string, Promise<ImageFit>>();
const FALLBACK: ImageFit = { fit: "cover", bg: "#ffffff" };

async function analyse(publicPath: string): Promise<ImageFit> {
	const file = path.join(process.cwd(), "public", decodeURI(publicPath));
	// Downscale first so edge sampling is cheap and ignores JPEG noise
	const { data, info } = await sharp(file)
		.flatten({ background: "#ffffff" })
		.resize(64, 64, { fit: "fill" })
		.raw()
		.toBuffer({ resolveWithObject: true });

	const { width: w, height: h, channels: ch } = info;
	const at = (x: number, y: number) => [
		...data.subarray((y * w + x) * ch, (y * w + x) * ch + 3),
	];
	const px: number[][] = [];
	for (let x = 0; x < w; x++) px.push(at(x, 0), at(x, h - 1));
	for (let y = 0; y < h; y++) px.push(at(0, y), at(w - 1, y));

	// Backdrop = the most common edge color; it is plain when most edge pixels match it
	const buckets = new Map<string, number[][]>();
	for (const p of px) {
		const key = p.map((v) => v >> 4).join();
		const list = buckets.get(key) ?? [];
		list.push(p);
		buckets.set(key, list);
	}
	const dominant = [...buckets.values()].sort((a, b) => b.length - a.length)[0];
	const share = dominant.length / px.length;
	const mean = [0, 1, 2].map((i) =>
		Math.round(dominant.reduce((s, p) => s + p[i], 0) / dominant.length),
	);

	return {
		fit: share >= 0.6 ? "contain" : "cover",
		bg: `rgb(${mean.join(" ")})`,
	};
}

export function getImageFit(
	publicPath: string | undefined | null,
): Promise<ImageFit> {
	if (!publicPath || !publicPath.startsWith("/"))
		return Promise.resolve(FALLBACK);
	let entry = cache.get(publicPath);
	if (!entry) {
		entry = analyse(publicPath).catch(() => FALLBACK);
		cache.set(publicPath, entry);
	}
	return entry;
}
