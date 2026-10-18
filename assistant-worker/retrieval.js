/**
 * Lightweight retrieval over the site knowledge base (/assistant-kb/{locale}.json).
 * Scores products, articles, pages and individual FAQ entries against the visitor's
 * question with a BM25-style ranking, then builds a compact context for the model.
 */

// Persian / Arabic letter variants and diacritics are folded so both spellings match.
export function normalize(s) {
	return String(s ?? "")
		.toLowerCase()
		.replace(/[يى]/g, "ی")
		.replace(/[ك]/g, "ک")
		.replace(/[ة]/g, "ه")
		.replace(/[أإآٱ]/g, "ا")
		.replace(/[ؤ]/g, "و")
		.replace(/[ً-ْٰ‌‍ـ]/g, "")
		.replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
		.replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
		.replace(/[^\p{L}\p{N}\s]/gu, " ");
}

const STOP = new Set(
	(
		"the a an and or of to in on for is are be it this that with my me i you your do does can how what which who types type kind kinds options " +
		"از به با در که این آن را و یا برای است هست هستند می من شما ما چه چی چطور چگونه آیا یک های ها کدام انواع نوع مدل مدلهای " +
		"في من على عن إلى الى هل ما هو هي أن ان او أو مع هذا هذه كيف لي انا أنا أنواع انواع نوع خيارات"
	)
		.split(" ")
		.map(normalize),
);

export function tokenize(s) {
	return normalize(s)
		.split(/\s+/)
		.filter((w) => w.length > 1 && !STOP.has(w));
}

/** Crude prefix stem so "braces"/"brace", "زانوبند"/"زانو" still meet. */
const stem = (w) => (w.length > 5 ? w.slice(0, 5) : w);

function buildDocs(kb) {
	const docs = [];
	for (const p of kb.products ?? []) {
		docs.push({
			kind: "product",
			title: p.title,
			url: p.url,
			fields: [
				[p.title, 4],
				[p.category, 2.5],
				[p.summary, 1.5],
				[p.details, 1],
				[(p.faq ?? []).map((f) => f.q).join(" "), 1],
			],
			ref: p,
		});
		for (const f of p.faq ?? []) {
			docs.push({ kind: "faq", title: f.q, url: p.url, fields: [[f.q, 3], [f.a, 1]], ref: { ...f, product: p.title, url: p.url } });
		}
	}
	for (const a of kb.articles ?? []) {
		docs.push({ kind: "article", title: a.title, url: a.url, fields: [[a.title, 4], [a.summary, 2], [a.details, 1]], ref: a });
	}
	for (const pg of kb.pages ?? []) {
		docs.push({ kind: "page", title: pg.title, url: pg.url, fields: [[pg.title, 4], [pg.summary, 2]], ref: pg });
	}
	for (const d of docs) {
		d.tf = new Map();
		let len = 0;
		for (const [text, weight] of d.fields) {
			for (const w of tokenize(text)) {
				const k = stem(w);
				d.tf.set(k, (d.tf.get(k) ?? 0) + weight);
				len += 1;
			}
		}
		d.len = len || 1;
	}
	const df = new Map();
	for (const d of docs) for (const k of d.tf.keys()) df.set(k, (df.get(k) ?? 0) + 1);
	const avgLen = docs.reduce((s, d) => s + d.len, 0) / (docs.length || 1);
	return { docs, df, avgLen, n: docs.length };
}

const indexCache = new WeakMap();

export function search(kb, query, limit = 8) {
	let index = indexCache.get(kb);
	if (!index) {
		index = buildDocs(kb);
		indexCache.set(kb, index);
	}
	const terms = [...new Set(tokenize(query).map(stem))];
	if (!terms.length) return [];
	const k1 = 1.2;
	const b = 0.6;
	return index.docs
		.map((d) => {
			let score = 0;
			for (const t of terms) {
				const tf = d.tf.get(t);
				if (!tf) continue;
				const idf = Math.log(1 + (index.n - index.df.get(t) + 0.5) / (index.df.get(t) + 0.5));
				score += idf * ((tf * (k1 + 1)) / (tf + k1 * (1 - b + (b * d.len) / index.avgLen)));
			}
			return { d, score };
		})
		.filter((r) => r.score > 0)
		.sort((x, y) => y.score - x.score)
		.slice(0, limit);
}

const clip = (s, n) => {
	const t = String(s ?? "");
	return t.length > n ? `${t.slice(0, n)}…` : t;
};

/** Context block for the model: business facts, full catalog index, and the most relevant material. */
export function buildContext(kb, query) {
	const lines = [];
	const site = kb.site ?? {};
	lines.push(
		"## Business",
		`${site.name} — ${site.address}. Phone/WhatsApp: ${site.phone}. Email: ${site.email}. Hours: ${site.hours}. Instagram: ${(site.instagram ?? []).join(", ")}.`,
		"",
		"## Full product catalog (title | category | price | url)",
	);
	for (const p of kb.products ?? []) lines.push(`- ${p.title} | ${p.category} | ${p.price || "price on request"} | ${p.url}`);
	lines.push("", "## Site pages");
	for (const pg of kb.pages ?? []) lines.push(`- ${pg.title}: ${pg.summary} | ${pg.url}`);

	const hits = search(kb, query, 10);
	const seen = new Set();
	const detail = [];
	let budget = 9000;
	for (const { d } of hits) {
		const key = `${d.kind}:${d.kind === "faq" ? d.title : d.url}`;
		if (seen.has(key)) continue;
		seen.add(key);
		let block = "";
		if (d.kind === "product") {
			const p = d.ref;
			block = `### Product: ${p.title} (${p.price || "price on request"}) — ${p.url}\n${p.summary}\n${clip(p.details, 1400)}`;
			const faq = (p.faq ?? []).slice(0, 3).map((f) => `Q: ${f.q}\nA: ${clip(f.a, 400)}`);
			if (faq.length) block += `\n${faq.join("\n")}`;
		} else if (d.kind === "faq") {
			block = `### FAQ (${d.ref.product} — ${d.ref.url})\nQ: ${d.ref.q}\nA: ${clip(d.ref.a, 600)}`;
		} else if (d.kind === "article") {
			block = `### Article: ${d.ref.title} — ${d.ref.url}\n${d.ref.summary}\n${clip(d.ref.details, 2000)}`;
		} else continue;
		if (block.length > budget) break;
		budget -= block.length;
		detail.push(block);
	}
	if (detail.length) lines.push("", "## Most relevant details for this question", ...detail);
	return lines.join("\n");
}
