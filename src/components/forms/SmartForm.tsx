import {
	ASSISTANT_API,
	CONTACT_EMAIL,
	WHATSAPP_PHONE_RAW,
} from "@utils/contact";
import { type FormEvent, useState } from "react";
import { FaWhatsapp } from "react-icons/fa6";
import { MdCheckCircle, MdMailOutline, MdSend } from "react-icons/md";

export type FormField = {
	name: string;
	label: string;
	type:
		| "text"
		| "tel"
		| "email"
		| "date"
		| "number"
		| "radio"
		| "checkboxes"
		| "select"
		| "consent"
		| "textarea";
	required?: boolean;
	options?: string[];
	placeholder?: string;
	suffix?: string;
	/** Grid span on md+ screens */
	wide?: boolean;
};

export type FormSection = { title: string; fields: FormField[] };

interface Props {
	formType: "referral" | "device-registration";
	locale: string;
	heading: string;
	sections: FormSection[];
	submitLabel: string;
	thankYou: {
		title: string;
		lines: string[];
		link?: { href: string; label: string };
	};
	labels: {
		required: string;
		sending: string;
		whatsappHint: string;
		email: string;
		again: string;
	};
}

type Values = Record<string, string | string[] | boolean>;

export default function SmartForm({
	formType,
	locale,
	heading,
	sections,
	submitLabel,
	thankYou,
	labels,
}: Props) {
	const [values, setValues] = useState<Values>({});
	const [errors, setErrors] = useState<Record<string, boolean>>({});
	const [sent, setSent] = useState(false);
	const [sending, setSending] = useState(false);
	const fields = sections.flatMap((s) => s.fields);

	const set = (name: string, v: string | string[] | boolean) => {
		setValues((prev) => ({ ...prev, [name]: v }));
		setErrors((e) => ({ ...e, [name]: false }));
	};

	const isEmpty = (f: FormField) => {
		const v = values[f.name];
		if (f.type === "consent") return v !== true;
		if (Array.isArray(v)) return v.length === 0;
		return !v || !String(v).trim();
	};

	const readable = () =>
		fields
			.filter((f) => f.type !== "consent" && !isEmpty(f))
			.map((f) => {
				const v = values[f.name];
				return [
					f.label,
					`${Array.isArray(v) ? v.join(", ") : String(v)}${f.suffix ? ` ${f.suffix}` : ""}`,
				] as const;
			});

	const message = () =>
		[`*${heading}*`, "", ...readable().map(([k, v]) => `*${k}:* ${v}`)].join(
			"\n",
		);

	function onSubmit(e: FormEvent) {
		e.preventDefault();
		const missing: Record<string, boolean> = {};
		for (const f of fields)
			if (f.required && isEmpty(f)) missing[f.name] = true;
		const email = fields.find((f) => f.type === "email");
		if (
			email &&
			values[email.name] &&
			!/^\S+@\S+\.\S+$/.test(String(values[email.name]))
		)
			missing[email.name] = true;
		setErrors(missing);
		if (Object.keys(missing).length) {
			document
				.querySelector(`[name="${Object.keys(missing)[0]}"]`)
				?.scrollIntoView({ behavior: "smooth", block: "center" });
			return;
		}

		// Open WhatsApp synchronously (avoids popup blockers), then send a copy for email records.
		window.open(
			`https://api.whatsapp.com/send?phone=${WHATSAPP_PHONE_RAW}&text=${encodeURIComponent(message())}`,
			"_blank",
			"noopener,noreferrer",
		);
		setSending(true);
		const controller = new AbortController();
		const timer = setTimeout(() => controller.abort(), 10000);
		fetch(`${ASSISTANT_API}/forms`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				type: formType,
				locale,
				data: Object.fromEntries(readable()),
			}),
			signal: controller.signal,
		})
			.catch(() => undefined)
			.finally(() => {
				clearTimeout(timer);
				setSending(false);
				setSent(true);
			});
	}

	if (sent) {
		const mailto = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(heading)}&body=${encodeURIComponent(message().replace(/\*/g, ""))}`;
		return (
			<div className="card-base p-8 md:p-12 text-center flex flex-col items-center gap-4 assessment-step">
				<span className="grid place-items-center w-20 h-20 rounded-full bg-[#16a34a]/10 text-[#16a34a] text-5xl">
					<MdCheckCircle />
				</span>
				<h2 className="text-2xl md:text-3xl font-extrabold text-90">
					{thankYou.title}
				</h2>
				{thankYou.lines.map((l) => (
					<p key={l} className="text-75 max-w-xl leading-relaxed">
						{l}
					</p>
				))}
				<div className="flex flex-wrap justify-center gap-2 mt-2">
					{thankYou.link && (
						<a href={thankYou.link.href} className="btn-grad">
							{thankYou.link.label}
						</a>
					)}
					<a href={mailto} className="btn-soft">
						<MdMailOutline /> {labels.email}
					</a>
					<button
						type="button"
						className="btn-soft"
						onClick={() => {
							setValues({});
							setSent(false);
						}}
					>
						{labels.again}
					</button>
				</div>
			</div>
		);
	}

	return (
		<form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
			{sections.map((section, si) => (
				<fieldset key={section.title} className="card-base p-6 md:p-8">
					<legend className="sr-only">{section.title}</legend>
					<h3 className="flex items-center gap-3 text-lg font-extrabold text-90 mb-5">
						<span className="grid place-items-center w-8 h-8 rounded-lg bg-[var(--primary)] text-white text-sm">
							{si + 1}
						</span>
						{section.title}
					</h3>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-5">
						{section.fields.map((f) => {
							const invalid = !!errors[f.name];
							const label = (
								<span className="field-label">
									{f.label}
									{f.required && (
										<span className="text-[var(--accent-red)]"> *</span>
									)}
								</span>
							);
							const wide =
								f.wide ||
								["radio", "checkboxes", "consent", "textarea"].includes(f.type);
							return (
								<div key={f.name} className={wide ? "md:col-span-2" : ""}>
									{f.type === "consent" ? (
										<label className="choice choice--check">
											<input
												type="checkbox"
												name={f.name}
												checked={values[f.name] === true}
												onChange={(e) => set(f.name, e.target.checked)}
											/>
											<span className="choice-mark" />
											<span>
												{f.label}
												{f.required && (
													<span className="text-[var(--accent-red)]"> *</span>
												)}
											</span>
										</label>
									) : f.type === "radio" || f.type === "checkboxes" ? (
										<>
											{label}
											<div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5">
												{f.options?.map((o) => {
													const current = values[f.name];
													const checked =
														f.type === "radio"
															? current === o
															: Array.isArray(current) && current.includes(o);
													return (
														<label
															key={o}
															className={`choice ${f.type === "checkboxes" ? "choice--check" : ""}`}
														>
															<input
																type={f.type === "radio" ? "radio" : "checkbox"}
																name={f.name}
																checked={checked}
																onChange={() => {
																	if (f.type === "radio") set(f.name, o);
																	else {
																		const arr = Array.isArray(current)
																			? current
																			: [];
																		set(
																			f.name,
																			checked
																				? arr.filter((x) => x !== o)
																				: [...arr, o],
																		);
																	}
																}}
															/>
															<span className="choice-mark" />
															{o}
														</label>
													);
												})}
											</div>
										</>
									) : f.type === "select" ? (
										<label className="block">
											{label}
											<select
												name={f.name}
												className="field-input"
												value={String(values[f.name] ?? "")}
												onChange={(e) => set(f.name, e.target.value)}
												aria-invalid={invalid}
											>
												<option value="">—</option>
												{f.options?.map((o) => (
													<option key={o} value={o}>
														{o}
													</option>
												))}
											</select>
										</label>
									) : f.type === "textarea" ? (
										<label className="block">
											{label}
											<textarea
												name={f.name}
												className="field-input"
												value={String(values[f.name] ?? "")}
												onChange={(e) => set(f.name, e.target.value)}
												placeholder={f.placeholder}
												aria-invalid={invalid}
											/>
										</label>
									) : (
										<label className="block">
											{label}
											<span className="relative block">
												<input
													name={f.name}
													type={f.type}
													inputMode={
														f.type === "tel"
															? "tel"
															: f.type === "number"
																? "decimal"
																: undefined
													}
													dir={
														["tel", "email", "number", "date"].includes(f.type)
															? "ltr"
															: undefined
													}
													className="field-input"
													value={String(values[f.name] ?? "")}
													onChange={(e) => set(f.name, e.target.value)}
													placeholder={f.placeholder}
													aria-invalid={invalid}
												/>
												{f.suffix && (
													<span className="absolute top-1/2 -translate-y-1/2 end-4 text-sm font-bold text-50 pointer-events-none">
														{f.suffix}
													</span>
												)}
											</span>
										</label>
									)}
									{invalid && <p className="field-error">{labels.required}</p>}
								</div>
							);
						})}
					</div>
				</fieldset>
			))}

			<div className="card-base p-5 md:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
				<p className="text-sm text-50 flex items-center gap-2">
					<FaWhatsapp className="text-[#16a34a] text-lg shrink-0" />{" "}
					{labels.whatsappHint}
				</p>
				<button type="submit" className="btn-grad shrink-0" disabled={sending}>
					<MdSend className="rtl:rotate-180" />{" "}
					{sending ? labels.sending : submitLabel}
				</button>
			</div>
		</form>
	);
}
