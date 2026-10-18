/**
 * Cloudflare Worker – Tadawi AI assistant + form intake API
 *
 * Secrets (wrangler secret put …):
 *   ANTHROPIC_API_KEY  – Claude API key (required for /chat)
 *   RESEND_API_KEY     – Resend API key (optional, emails form submissions)
 * Vars (wrangler.toml):
 *   SITE_URL           – https://tadawilifetech.com (knowledge base source)
 *   FORMS_TO_EMAIL     – inbox that receives referrals / device registrations
 *   FORMS_FROM_EMAIL   – verified Resend sender
 * Optional KV binding:
 *   FORMS              – keeps a copy of every submission
 *
 * Endpoints:
 *   POST /chat   { locale, messages: [{ role, content }] }  → text/event-stream of {"t": "..."} chunks
 *   POST /forms  { type, locale, data }                     → { ok: true, id }
 */
import Anthropic from "@anthropic-ai/sdk";

const MODEL = "claude-opus-5-5";
const ALLOWED_ORIGINS = [
	"https://tadawilifetech.com",
	"https://www.tadawilifetech.com",
	"http://localhost:4321",
	"http://localhost:4322",
	"http://localhost:4323",
];
const LOCALES = ["en", "ar", "fa"];
const MAX_TURNS = 16;
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
	if (cached && Date.now() - cached.at < 30 * 60 * 1000) return cached.text;
	const res = await fetch(`${env.SITE_URL || "https://tadawilifetech.com"}/assistant-kb/${locale}.json`, {
		cf: { cacheTtl: 1800 },
	});
	if (!res.ok) throw new Error(`Knowledge base unavailable (${res.status})`);
	const kb = await res.json();
	// Deterministic serialization keeps the cached prompt prefix byte-stable.
	const text = JSON.stringify(kb);
	kbCache.set(locale, { at: Date.now(), text });
	return text;
}

const INSTRUCTIONS = `You are the Tadawi Life Tech assistant on tadawilifetech.com. Tadawi Life Tech is based in Al Ghubrah, Muscat, Oman, and provides sleep health, respiratory care and orthopedic solutions: CPAP/BiPAP devices and masks, home sleep testing, oral appliances (MAD), positional therapy, oxygen concentrators, nasal care, Ortino orthopedic braces, plus education and patient support.

Help visitors quickly find answers so they don't have to search the site.
- Answer in the visitor's language (the conversation locale is given below). Keep replies short: 2–6 sentences or a compact list.
- Use only the knowledge base for product facts, prices (OMR) and links. If something is not in it, say so and offer WhatsApp/phone contact.
- When you mention a product or page, link it with markdown using the exact relative URL from the knowledge base, e.g. [Heyer Auto CPAP](/en/products/heyer-auto-cpap-machine/).
- You are not a doctor. Never diagnose or prescribe. For symptoms such as loud snoring, breathing pauses or daytime sleepiness, suggest the free online Sleep Assessment and seeing a physician. For emergencies, tell the person to contact emergency services.
- For orders, availability or anything needing a person, point to WhatsApp +968 91235160 or the Contact page.
- Latency-sensitive; begin your visible answer immediately.`;

async function handleChat(request, env, origin) {
	if (!env.ANTHROPIC_API_KEY) return json({ error: "Assistant not configured" }, 503, origin);
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
	const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

	const encoder = new TextEncoder();
	const { readable, writable } = new TransformStream();
	const writer = writable.getWriter();
	const send = (obj) => writer.write(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));

	(async () => {
		try {
			const stream = client.beta.messages.stream({
				model: MODEL,
				max_tokens: 4000,
				betas: ["server-side-fallback-2026-07-01"],
				fallbacks: "default",
				output_config: { effort: "low" },
				system: [
					{ type: "text", text: INSTRUCTIONS },
					// Stable per-locale knowledge base, cached across conversations.
					{ type: "text", text: `Knowledge base (JSON):\n${kb}`, cache_control: { type: "ephemeral", ttl: "1h" } },
					{ type: "text", text: `Conversation locale: ${locale}` },
				],
				messages,
			});
			for await (const event of stream) {
				if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
					await send({ t: event.delta.text });
				}
			}
			const final = await stream.finalMessage();
			if (final.stop_reason === "refusal") {
				await send({ refusal: true });
			}
			await send({ done: true });
		} catch (error) {
			if (error instanceof Anthropic.RateLimitError) await send({ error: "busy" });
			else if (error instanceof Anthropic.APIError) await send({ error: `api_${error.status ?? "error"}` });
			else await send({ error: "unavailable" });
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
