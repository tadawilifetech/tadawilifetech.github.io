/**
 * Cloudflare Worker – Tadawi AI assistant + form intake API
 *
 * The assistant runs on Cloudflare Workers AI (free daily allowance, no API key):
 * the static GitHub Pages site posts questions here, the worker retrieves the most
 * relevant site content and streams the model's answer back.
 *
 * Bindings / vars (wrangler.toml):
 *   AI                 – Workers AI binding (required for /chat)
 *   AI_MODEL           – optional model override
 *   SITE_URL           – https://tadawilifetech.com (knowledge base source)
 *   FORMS_TO_EMAIL     – inbox that receives referrals / device registrations
 *   FORMS_FROM_EMAIL   – verified Resend sender
 * Secrets (wrangler secret put …):
 *   RESEND_API_KEY     – Resend API key (optional, emails form submissions)
 * Optional KV binding:
 *   FORMS              – keeps a copy of every submission
 *
 * Endpoints:
 *   POST /chat   { locale, messages: [{ role, content }] }  → text/event-stream of {"t": "..."} chunks
 *   POST /forms  { type, locale, data }                     → { ok: true, id }
 */
import { buildContext } from "./retrieval.js";

// Mistral Small 3.1 tested best for Persian/Arabic answers that follow the linking rules; the rest are fallbacks.
const MODELS = [
	"@cf/mistralai/mistral-small-3.1-24b-instruct",
	"@cf/meta/llama-3.3-70b-instruct-fp8-fast",
	"@cf/google/gemma-3-12b-it",
];
const ALLOWED_ORIGINS = [
	"https://tadawilifetech.com",
	"https://www.tadawilifetech.com",
	"https://tadawilifetech.github.io",
	"http://localhost:4321",
	"http://localhost:4322",
	"http://localhost:4323",
];
const LOCALES = ["en", "ar", "fa"];
const LANGUAGE = { en: "English", ar: "Arabic", fa: "Persian (Farsi)" };
const MAX_TURNS = 10;
const MAX_CHARS = 2000;
const RATE_LIMIT = 30; // requests per IP per 10 minutes (per isolate)

const kbCache = new Map();
const hits = new Map();

function corsHeaders(origin) {
	const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
	return {
		"Access-Control-Allow-Origin": allowed,
		"Access-Control-Allow-Methods": "POST, OPTIONS",
		"Access-Control-Allow-Headers": "Content-Type",
		Vary: "Origin",
	};
}

function json(data, status, origin) {
	return new Response(JSON.stringify(data), {
		status,
		headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
	});
}

function rateLimited(ip) {
	const now = Date.now();
	const windowStart = now - 10 * 60 * 1000;
	const list = (hits.get(ip) || []).filter((t) => t > windowStart);
	list.push(now);
	hits.set(ip, list);
	return list.length > RATE_LIMIT;
}

async function loadKnowledgeBase(env, locale) {
	const cached = kbCache.get(locale);
	if (cached && Date.now() - cached.at < 30 * 60 * 1000) return cached.kb;
	const res = await fetch(`${env.SITE_URL || "https://tadawilifetech.com"}/assistant-kb/${locale}.json`, {
		cf: { cacheTtl: 1800 },
	});
	if (!res.ok) throw new Error(`Knowledge base unavailable (${res.status})`);
	const kb = await res.json();
	kbCache.set(locale, { at: Date.now(), kb });
	return kb;
}

function systemPrompt(locale, context) {
	return `You are the official virtual assistant of Tadawi Life Tech (tadawilifetech.com), a medical-equipment company in Al Ghubrah, Muscat, Oman, specialising in sleep apnea therapy (CPAP/BiPAP devices, masks and accessories, home sleep testing, oral appliances, positional therapy), respiratory care and Ortino orthopedic braces.

Your job: give visitors clear, accurate, genuinely helpful answers so they don't need to search the site, and guide them to the right product or next step.

Language and tone
- Reply in the language the visitor writes in (Persian, Arabic or English); if unclear, use ${LANGUAGE[locale]}. Use natural, fluent, professional wording — warm, confident and concise, like an experienced clinical product specialist. Never mix in words from other languages or scripts.
- Keep answers focused: usually 3–7 sentences, or a short bulleted list when comparing options. Use **bold** for product names or key points. No headings, no tables.

Facts and links
- Use ONLY the reference material below for product names, features, prices (OMR) and URLs. Never invent products, prices, specifications, stock or delivery times. If the answer isn't in the material, say so briefly and offer WhatsApp/phone.
- Product/page links must use the URLs in the material below (they point to the ${LANGUAGE[locale]} pages of the site).
- Every time you name a product, article or page, the name itself MUST be the markdown link, using its exact relative URL from the material: write [Product name](/${locale === "en" ? "" : `${locale}/`}products/...) — never the bare name, never bold instead of a link, and never the name followed by the same link in parentheses.
- Recommend at most 3 products; for comparisons use a short bullet per product: link — price — one line on who it suits.
- When the visitor's need is unclear (e.g. "which device is right for me?"), give a short helpful overview of the options and ask one focused follow-up question.

Medical safety
- You are not a doctor. Do not diagnose, prescribe or set CPAP pressures. Explain general information, then recommend a physician or sleep specialist where appropriate.
- For possible sleep apnea symptoms (loud snoring, breathing pauses, choking at night, daytime sleepiness), suggest the free online Sleep Assessment and a home sleep test.
- For emergencies (chest pain, severe breathing difficulty), tell the person to call emergency services immediately.

Orders and contact
- For purchase, availability, delivery, prices not listed, or anything needing a person: WhatsApp/phone ${"+968 91235160"} or the Contact page.

Reference material
${context}`;
}

/** Workers AI streams SSE lines `data: {"response":"…"}`; newer models may use OpenAI-style deltas. */
async function pipeModelStream(stream, send) {
	const reader = stream.getReader();
	const decoder = new TextDecoder();
	let buffer = "";
	let produced = false;
	while (true) {
		const { value, done } = await reader.read();
		if (done) break;
		buffer += decoder.decode(value, { stream: true });
		const lines = buffer.split("\n");
		buffer = lines.pop() ?? "";
		for (const raw of lines) {
			const line = raw.trim();
			if (!line.startsWith("data:")) continue;
			const payload = line.slice(5).trim();
			if (!payload || payload === "[DONE]") continue;
			let data;
			try {
				data = JSON.parse(payload);
			} catch {
				continue;
			}
			// Some models emit numeric tokens (e.g. a price) as JSON numbers, so coerce to text.
			const value = data.response ?? data.choices?.[0]?.delta?.content;
			const chunk = value == null ? "" : String(value);
			if (chunk) {
				produced = true;
				await send({ t: chunk });
			}
		}
	}
	return produced;
}

async function handleChat(request, env, origin) {
	if (!env.AI) return json({ error: "Assistant not configured" }, 503, origin);
	const body = await request.json().catch(() => null);
	const locale = LOCALES.includes(body?.locale) ? body.locale : "en";
	const raw = Array.isArray(body?.messages) ? body.messages.slice(-MAX_TURNS) : [];
	const messages = raw
		.filter((m) => (m?.role === "user" || m?.role === "assistant") && typeof m.content === "string" && m.content.trim())
		.map((m) => ({ role: m.role, content: m.content.slice(0, MAX_CHARS) }));
	while (messages.length && messages[0].role !== "user") messages.shift();
	if (!messages.length || messages[messages.length - 1].role !== "user") {
		return json({ error: "Invalid conversation" }, 400, origin);
	}

	const kb = await loadKnowledgeBase(env, locale);
	// Retrieve with the latest question plus the previous user turn, so follow-ups keep their topic.
	const userTurns = messages.filter((m) => m.role === "user").map((m) => m.content);
	const query = userTurns.slice(-2).join(" ");
	const system = systemPrompt(locale, buildContext(kb, query));
	const models = env.AI_MODEL ? [env.AI_MODEL, ...MODELS] : MODELS;

	const encoder = new TextEncoder();
	const { readable, writable } = new TransformStream();
	const writer = writable.getWriter();
	const send = (obj) => writer.write(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));

	(async () => {
		try {
			let answered = false;
			for (const model of models) {
				try {
					const stream = await env.AI.run(model, {
						messages: [{ role: "system", content: system }, ...messages],
						stream: true,
						max_tokens: 900,
						temperature: 0.3,
					});
					answered = await pipeModelStream(stream, send);
					if (answered) break;
				} catch (error) {
					console.error(`model ${model} failed`, error);
				}
			}
			await send(answered ? { done: true } : { error: "unavailable" });
		} catch {
			await send({ error: "unavailable" });
		} finally {
			await writer.close();
		}
	})();

	return new Response(readable, {
		headers: {
			"Content-Type": "text/event-stream; charset=utf-8",
			"Cache-Control": "no-cache",
			...corsHeaders(origin),
		},
	});
}

const FORM_TITLES = {
	referral: "New Online Referral",
	"device-registration": "New Device Registration",
	contact: "New Contact Message",
};

function escapeHtml(value) {
	return String(value).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

async function handleForms(request, env, origin) {
	const body = await request.json().catch(() => null);
	const type = body?.type;
	if (!FORM_TITLES[type] || typeof body?.data !== "object" || body.data === null) {
		return json({ error: "Invalid form" }, 400, origin);
	}
	const entries = Object.entries(body.data)
		.slice(0, 40)
		.map(([k, v]) => [String(k).slice(0, 60), Array.isArray(v) ? v.join(", ") : String(v ?? "")].map((s) => s.slice(0, 1000)));
	const id = `${type}-${new Date().toISOString()}-${crypto.randomUUID().slice(0, 8)}`;
	const record = { id, type, locale: body.locale || "en", receivedAt: new Date().toISOString(), data: Object.fromEntries(entries) };

	if (env.FORMS) await env.FORMS.put(id, JSON.stringify(record));

	if (env.RESEND_API_KEY && env.FORMS_TO_EMAIL) {
		const rows = entries.map(([k, v]) => `<tr><td style="padding:6px 12px;font-weight:600">${escapeHtml(k)}</td><td style="padding:6px 12px">${escapeHtml(v)}</td></tr>`).join("");
		const res = await fetch("https://api.resend.com/emails", {
			method: "POST",
			headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
			body: JSON.stringify({
				from: env.FORMS_FROM_EMAIL || "Tadawi Website <forms@tadawilifetech.com>",
				to: [env.FORMS_TO_EMAIL],
				subject: `${FORM_TITLES[type]} – tadawilifetech.com`,
				html: `<h2>${FORM_TITLES[type]}</h2><p>Reference: ${escapeHtml(id)}</p><table border="1" cellspacing="0" style="border-collapse:collapse">${rows}</table>`,
			}),
		});
		if (!res.ok) return json({ error: "Email failed" }, 502, origin);
	}

	return json({ ok: true, id }, 200, origin);
}

export default {
	async fetch(request, env) {
		const origin = request.headers.get("Origin") || "";
		if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders(origin) });
		if (request.method !== "POST") return json({ error: "Not found" }, 404, origin);

		const ip = request.headers.get("CF-Connecting-IP") || "unknown";
		if (rateLimited(ip)) return json({ error: "Too many requests" }, 429, origin);

		const { pathname } = new URL(request.url);
		try {
			if (pathname === "/chat") return await handleChat(request, env, origin);
			if (pathname === "/forms") return await handleForms(request, env, origin);
			return json({ error: "Not found" }, 404, origin);
		} catch (error) {
			return json({ error: error instanceof Error ? error.message : "Server error" }, 500, origin);
		}
	},
};
