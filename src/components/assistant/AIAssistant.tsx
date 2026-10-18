import { ASSISTANT_API, WHATSAPP_PHONE_RAW } from "@utils/contact";
import type { SiteLocale } from "@utils/locale-utils";
import {
	type ReactNode,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";
import { FaWhatsapp } from "react-icons/fa6";
import { MdAutoAwesome, MdClose, MdRefresh, MdSend } from "react-icons/md";

type ChatMessage = { role: "user" | "assistant"; content: string };

type KnowledgeBase = {
	pages: { title: string; url: string; summary: string }[];
	products: {
		title: string;
		url: string;
		price: string;
		category: string;
		summary: string;
		faq: { q: string; a: string }[];
	}[];
};

const text = {
	en: {
		launcher: "Ask AI",
		title: "Tadawi AI Assistant",
		subtitle: "Instant answers about sleep, CPAP & braces",
		greeting:
			"Hi! 👋 I can help you find the right product, explain CPAP/BiPAP therapy, or point you to the Sleep Assessment. What would you like to know?",
		placeholder: "Type your question…",
		send: "Send",
		reset: "New chat",
		close: "Close",
		human: "Talk to a person",
		disclaimer:
			"AI answers are for information only and are not medical advice.",
		found: "Here is what I found on our site:",
		nothing:
			"I couldn't find that on our site. Our team can help directly on WhatsApp — tap “Talk to a person” below.",
		error:
			"Sorry, something went wrong. Please try again or contact us on WhatsApp.",
		suggestions: [
			"Do I have sleep apnea?",
			"Which CPAP device is right for me?",
			"How do I clean my CPAP mask?",
			"Knee brace options",
			"How do I register my device?",
		],
	},
	ar: {
		launcher: "اسأل الذكاء الاصطناعي",
		title: "مساعد تداوي الذكي",
		subtitle: "إجابات فورية عن النوم وأجهزة CPAP والدعامات",
		greeting:
			"مرحباً! 👋 يمكنني مساعدتك في اختيار المنتج المناسب أو شرح علاج CPAP/BiPAP أو توجيهك إلى تقييم النوم. بماذا أساعدك؟",
		placeholder: "اكتب سؤالك…",
		send: "إرسال",
		reset: "محادثة جديدة",
		close: "إغلاق",
		human: "تحدث مع شخص",
		disclaimer: "إجابات الذكاء الاصطناعي للمعلومات فقط ولا تُعد استشارة طبية.",
		found: "إليك ما وجدته في موقعنا:",
		nothing:
			"لم أجد ذلك في موقعنا. يمكن لفريقنا مساعدتك مباشرة عبر واتساب — اضغط «تحدث مع شخص».",
		error: "عذراً، حدث خطأ. حاول مرة أخرى أو تواصل معنا عبر واتساب.",
		suggestions: [
			"هل لدي انقطاع النفس أثناء النوم؟",
			"أي جهاز CPAP يناسبني؟",
			"كيف أنظف قناع CPAP؟",
			"خيارات دعامات الركبة",
			"كيف أسجل جهازي؟",
		],
	},
	fa: {
		launcher: "از هوش مصنوعی بپرسید",
		title: "دستیار هوشمند تداوی",
		subtitle: "پاسخ فوری درباره خواب، CPAP و بریس‌ها",
		greeting:
			"سلام! 👋 می‌توانم در انتخاب محصول مناسب، توضیح درمان CPAP/BiPAP یا راهنمایی برای ارزیابی خواب کمکتان کنم. چه سؤالی دارید؟",
		placeholder: "سؤال خود را بنویسید…",
		send: "ارسال",
		reset: "گفتگوی جدید",
		close: "بستن",
		human: "صحبت با کارشناس",
		disclaimer:
			"پاسخ‌های هوش مصنوعی صرفاً اطلاع‌رسانی هستند و توصیه پزشکی محسوب نمی‌شوند.",
		found: "این موارد را در سایت پیدا کردم:",
		nothing:
			"این مورد را در سایت پیدا نکردم. تیم ما مستقیم در واتساپ کمکتان می‌کند — روی «صحبت با کارشناس» بزنید.",
		error:
			"متأسفیم، خطایی رخ داد. دوباره تلاش کنید یا در واتساپ با ما تماس بگیرید.",
		suggestions: [
			"آیا آپنه خواب دارم؟",
			"کدام دستگاه CPAP برای من مناسب است؟",
			"ماسک CPAP را چطور تمیز کنم؟",
			"انواع زانوبند",
			"چطور دستگاهم را ثبت کنم؟",
		],
	},
} as const;

// ---------- Offline fallback: keyword search over the site knowledge base ----------
function normalize(s: string) {
	return s
		.toLowerCase()
		.replace(/[ي]/g, "ی")
		.replace(/[ك]/g, "ک")
		.replace(/[ة]/g, "ه")
		.replace(/[أإآ]/g, "ا")
		.replace(/[ً-ْ‌]/g, "")
		.replace(/[^\p{L}\p{N}\s]/gu, " ");
}
const tokens = (s: string) =>
	normalize(s)
		.split(/\s+/)
		.filter((w) => w.length > 2);

function localAnswer(
	question: string,
	kb: KnowledgeBase,
	ui: (typeof text)[SiteLocale],
): string {
	const q = new Set(tokens(question));
	if (!q.size) return ui.nothing;
	const score = (fields: [string, number][]) => {
		let s = 0;
		for (const [field, weight] of fields) {
			for (const w of tokens(field)) if (q.has(w)) s += weight;
		}
		return s;
	};
	const docs = [
		...kb.products.map((p) => ({
			title: p.title,
			url: p.url,
			extra: p.price,
			s: score([
				[p.title, 4],
				[p.category, 2],
				[p.summary, 1],
			]),
		})),
		...kb.pages.map((p) => ({
			title: p.title,
			url: p.url,
			extra: "",
			s: score([
				[p.title, 4],
				[p.summary, 2],
			]),
		})),
	]
		.filter((d) => d.s > 0)
		.sort((a, b) => b.s - a.s)
		.slice(0, 4);

	let bestFaq: { q: string; a: string; s: number } | null = null;
	for (const p of kb.products) {
		for (const f of p.faq) {
			const s = score([
				[f.q, 3],
				[f.a, 1],
			]);
			if (s > 3 && (!bestFaq || s > bestFaq.s)) bestFaq = { ...f, s };
		}
	}
	if (!docs.length && !bestFaq) return ui.nothing;
	const lines: string[] = [];
	if (bestFaq) lines.push(`**${bestFaq.q}**`, bestFaq.a, "");
	if (docs.length) {
		lines.push(ui.found);
		for (const d of docs)
			lines.push(`- [${d.title}](${d.url})${d.extra ? ` — ${d.extra}` : ""}`);
	}
	return lines.join("\n");
}

// ---------- Safe markdown-lite rendering ----------
function renderInline(s: string, key: string): ReactNode[] {
	const out: ReactNode[] = [];
	const re = /\*\*([^*]+)\*\*|\[([^\]]+)\]\(([^)\s]+)\)/g;
	let last = 0;
	let m: RegExpExecArray | null;
	let i = 0;
	while ((m = re.exec(s))) {
		if (m.index > last) out.push(s.slice(last, m.index));
		if (m[1]) out.push(<strong key={`${key}-b${i++}`}>{m[1]}</strong>);
		else {
			const href = m[3];
			const safe = href.startsWith("/") || href.startsWith("https://");
			out.push(
				safe ? (
					<a
						key={`${key}-a${i++}`}
						href={href}
						className="ai-link"
						{...(href.startsWith("https://")
							? { target: "_blank", rel: "noopener noreferrer" }
							: {})}
					>
						{m[2]}
					</a>
				) : (
					m[2]
				),
			);
		}
		last = re.lastIndex;
	}
	if (last < s.length) out.push(s.slice(last));
	return out;
}

function Markdown({ source }: { source: string }) {
	const blocks: ReactNode[] = [];
	const lines = source.split("\n");
	let list: string[] = [];
	const flush = (k: number) => {
		if (!list.length) return;
		blocks.push(
			<ul key={`ul${k}`} className="ai-list">
				{list.map((l, j) => (
					<li key={j}>{renderInline(l, `li${k}-${j}`)}</li>
				))}
			</ul>,
		);
		list = [];
	};
	lines.forEach((line, k) => {
		const item = line.match(/^\s*(?:[-*•]|\d+[.)])\s+(.*)$/);
		if (item) {
			list.push(item[1]);
			return;
		}
		flush(k);
		if (line.trim())
			blocks.push(
				<p key={`p${k}`}>
					{renderInline(line.replace(/^#+\s*/, ""), `p${k}`)}
				</p>,
			);
	});
	flush(lines.length);
	return <>{blocks}</>;
}

// ---------- Component ----------
export default function AIAssistant({
	locale = "en",
}: {
	locale?: SiteLocale;
}) {
	const ui = text[locale] ?? text.en;
	const storageKey = `tadawi-assistant-${locale}`;
	const [open, setOpen] = useState(false);
	const [messages, setMessages] = useState<ChatMessage[]>([]);
	const [input, setInput] = useState("");
	const [busy, setBusy] = useState(false);
	const kbRef = useRef<KnowledgeBase | null>(null);
	const listRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLTextAreaElement>(null);
	const abortRef = useRef<AbortController | null>(null);

	useEffect(() => {
		try {
			const saved = sessionStorage.getItem(storageKey);
			if (saved) setMessages(JSON.parse(saved));
		} catch {
			/* storage unavailable */
		}
		const openHandler = () => setOpen(true);
		window.addEventListener("assistant:open", openHandler);
		return () => window.removeEventListener("assistant:open", openHandler);
	}, [storageKey]);

	useEffect(() => {
		try {
			sessionStorage.setItem(storageKey, JSON.stringify(messages.slice(-20)));
		} catch {
			/* storage unavailable */
		}
		listRef.current?.scrollTo({
			top: listRef.current.scrollHeight,
			behavior: "smooth",
		});
	}, [messages, storageKey]);

	useEffect(() => {
		if (open) setTimeout(() => inputRef.current?.focus(), 250);
		const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
		document.addEventListener("keydown", onKey);
		return () => document.removeEventListener("keydown", onKey);
	}, [open]);

	const loadKb = useCallback(async () => {
		if (kbRef.current) return kbRef.current;
		const res = await fetch(`/assistant-kb/${locale}.json`);
		kbRef.current = (await res.json()) as KnowledgeBase;
		return kbRef.current;
	}, [locale]);

	const appendToLast = (chunk: string) =>
		setMessages((prev) => {
			const next = [...prev];
			next[next.length - 1] = {
				role: "assistant",
				content: next[next.length - 1].content + chunk,
			};
			return next;
		});

	async function ask(question: string) {
		const q = question.trim();
		if (!q || busy) return;
		const history: ChatMessage[] = [...messages, { role: "user", content: q }];
		setMessages([...history, { role: "assistant", content: "" }]);
		setInput("");
		setBusy(true);

		let streamed = false;
		try {
			abortRef.current = new AbortController();
			const timeout = setTimeout(() => abortRef.current?.abort(), 45000);
			const res = await fetch(`${ASSISTANT_API}/chat`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ locale, messages: history }),
				signal: abortRef.current.signal,
			});
			if (!res.ok || !res.body) throw new Error(`status ${res.status}`);
			const reader = res.body.getReader();
			const decoder = new TextDecoder();
			let buffer = "";
			let failed = false;
			while (true) {
				const { value, done } = await reader.read();
				if (done) break;
				buffer += decoder.decode(value, { stream: true });
				const events = buffer.split("\n\n");
				buffer = events.pop() ?? "";
				for (const evt of events) {
					const line = evt.trim();
					if (!line.startsWith("data:")) continue;
					const data = JSON.parse(line.slice(5));
					if (data.t) {
						streamed = true;
						appendToLast(data.t);
					}
					if (data.error || data.refusal) failed = true;
				}
			}
			clearTimeout(timeout);
			if (!streamed || failed) throw new Error("no answer");
		} catch {
			// AI unavailable → answer from the site knowledge base instead
			try {
				const kb = await loadKb();
				const answer = localAnswer(q, kb, ui);
				setMessages((prev) => {
					const next = [...prev];
					const current = next[next.length - 1].content;
					next[next.length - 1] = {
						role: "assistant",
						content: streamed ? `${current}\n\n${answer}` : answer,
					};
					return next;
				});
			} catch {
				setMessages((prev) => [
					...prev.slice(0, -1),
					{ role: "assistant", content: ui.error },
				]);
			}
		} finally {
			setBusy(false);
		}
	}

	function reset() {
		abortRef.current?.abort();
		setMessages([]);
		setBusy(false);
	}

	const lastUserQuestion =
		[...messages].reverse().find((m) => m.role === "user")?.content ?? "";
	const whatsappHref = `https://api.whatsapp.com/send?phone=${WHATSAPP_PHONE_RAW}${lastUserQuestion ? `&text=${encodeURIComponent(lastUserQuestion)}` : ""}`;

	return (
		<div className="ai-assistant-root">
			<button
				type="button"
				className={`ai-launcher ${open ? "is-hidden" : ""}`}
				onClick={() => setOpen(true)}
				aria-label={ui.launcher}
				aria-expanded={open}
			>
				<span className="ai-launcher-orb">
					<MdAutoAwesome aria-hidden="true" />
				</span>
				<span className="ai-launcher-label">{ui.launcher}</span>
			</button>

			<section
				className={`ai-panel ${open ? "is-open" : ""}`}
				role="dialog"
				aria-label={ui.title}
				aria-hidden={!open}
			>
				<header className="ai-header">
					<span className="ai-avatar">
						<MdAutoAwesome aria-hidden="true" />
					</span>
					<div className="min-w-0 flex-1">
						<div className="ai-title">{ui.title}</div>
						<div className="ai-subtitle">
							<span className="ai-online" /> {ui.subtitle}
						</div>
					</div>
					{messages.length > 0 && (
						<button
							type="button"
							className="ai-icon-btn"
							onClick={reset}
							aria-label={ui.reset}
							title={ui.reset}
						>
							<MdRefresh />
						</button>
					)}
					<button
						type="button"
						className="ai-icon-btn"
						onClick={() => setOpen(false)}
						aria-label={ui.close}
					>
						<MdClose />
					</button>
				</header>

				<div className="ai-messages" ref={listRef} aria-live="polite">
					<div className="ai-msg ai-msg--bot">
						<p>{ui.greeting}</p>
					</div>
					{messages.map((m, i) => (
						<div
							key={i}
							className={`ai-msg ${m.role === "user" ? "ai-msg--user" : "ai-msg--bot"}`}
						>
							{m.role === "assistant" && !m.content ? (
								<span className="ai-typing" aria-label="…">
									<i />
									<i />
									<i />
								</span>
							) : m.role === "assistant" ? (
								<Markdown source={m.content} />
							) : (
								<p>{m.content}</p>
							)}
						</div>
					))}
					{messages.length === 0 && (
						<div className="ai-suggestions">
							{ui.suggestions.map((s) => (
								<button
									key={s}
									type="button"
									className="ai-suggestion"
									onClick={() => ask(s)}
								>
									{s}
								</button>
							))}
						</div>
					)}
				</div>

				<form
					className="ai-input"
					onSubmit={(e) => {
						e.preventDefault();
						void ask(input);
					}}
				>
					<textarea
						ref={inputRef}
						rows={1}
						value={input}
						maxLength={2000}
						placeholder={ui.placeholder}
						onChange={(e) => setInput(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === "Enter" && !e.shiftKey) {
								e.preventDefault();
								void ask(input);
							}
						}}
					/>
					<button
						type="submit"
						className="ai-send"
						disabled={busy || !input.trim()}
						aria-label={ui.send}
					>
						<MdSend className="rtl:rotate-180" />
					</button>
				</form>
				<footer className="ai-footer">
					<a
						href={whatsappHref}
						target="_blank"
						rel="noopener noreferrer"
						className="ai-human"
					>
						<FaWhatsapp /> {ui.human}
					</a>
					<span>{ui.disclaimer}</span>
				</footer>
			</section>
		</div>
	);
}
