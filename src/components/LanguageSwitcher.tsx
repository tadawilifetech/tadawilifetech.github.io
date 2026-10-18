import {
	applyStoredLanguage,
	getSupportedLanguages,
	setStoredLang,
} from "@utils/lang-utils";
import { type SiteLocale, switchLocaleInPath } from "@utils/locale-utils";
import { useEffect, useRef, useState } from "react";
import { MdCheck, MdKeyboardArrowDown, MdTranslate } from "react-icons/md";

const languages = getSupportedLanguages() as Array<{
	code: SiteLocale;
	label: string;
	dir: "ltr" | "rtl";
}>;

const shortLabel: Record<SiteLocale, string> = {
	en: "EN",
	ar: "عربي",
	fa: "فارسی",
};
const heading: Record<SiteLocale, string> = {
	en: "Choose language",
	ar: "اختر اللغة",
	fa: "انتخاب زبان",
};

interface Props {
	locale?: SiteLocale;
}

export default function LanguageSwitcher({ locale = "en" }: Props) {
	const [open, setOpen] = useState(false);
	const rootRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		applyStoredLanguage(locale);
	}, [locale]);

	useEffect(() => {
		if (!open) return;
		const onDocClick = (e: MouseEvent) => {
			if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
		};
		const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
		document.addEventListener("click", onDocClick);
		document.addEventListener("keydown", onKey);
		return () => {
			document.removeEventListener("click", onDocClick);
			document.removeEventListener("keydown", onKey);
		};
	}, [open]);

	function switchLang(code: SiteLocale) {
		setOpen(false);
		if (code === locale) return;
		setStoredLang(code);
		window.location.assign(
			switchLocaleInPath(
				`${window.location.pathname}${window.location.search}${window.location.hash}`,
				code,
			),
		);
	}

	return (
		<div ref={rootRef} className="relative z-50">
			<button
				type="button"
				aria-label={`Language: ${shortLabel[locale]}`}
				aria-haspopup="menu"
				aria-expanded={open}
				onClick={() => setOpen((v) => !v)}
				className="btn-plain flex items-center gap-1 h-10 rounded-xl px-2.5 text-sm font-bold"
			>
				<MdTranslate className="text-[1.15rem]" aria-hidden="true" />
				<span className="hidden sm:inline">{shortLabel[locale]}</span>
				<MdKeyboardArrowDown
					className={`text-[1.05rem] transition-transform ${open ? "rotate-180" : ""}`}
					aria-hidden="true"
				/>
			</button>

			<div
				role="menu"
				className={`absolute top-12 ltr:right-0 rtl:left-0 transition ${open ? "" : "float-panel-closed"}`}
			>
				<div className="card-base float-panel !top-0 p-2 min-w-[12rem] shadow-2xl border border-black/5 dark:border-white/10">
					<div className="px-3 pt-1 pb-2 text-[0.7rem] font-bold uppercase tracking-wider text-50">
						{heading[locale]}
					</div>
					{languages.map((lang) => {
						const current = lang.code === locale;
						return (
							<button
								type="button"
								role="menuitemradio"
								aria-checked={current}
								key={lang.code}
								dir={lang.dir}
								onClick={() => switchLang(lang.code)}
								className={`flex w-full items-center justify-between gap-3 rounded-xl h-10 px-3 text-sm font-semibold transition hover:bg-[var(--btn-plain-bg-hover)] ${
									current
										? "text-[var(--primary)] bg-[var(--btn-plain-bg-hover)]"
										: "text-75"
								}`}
							>
								<span>{lang.label}</span>
								{current && (
									<MdCheck className="text-base" aria-hidden="true" />
								)}
							</button>
						);
					})}
				</div>
			</div>
		</div>
	);
}
