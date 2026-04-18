import { useEffect, useState } from "react";
import { MdTranslate } from "react-icons/md";
import {
	applyStoredLanguage,
	getStoredLang,
	getSupportedLanguages,
	setStoredLang,
} from "@utils/lang-utils";
import { type SiteLocale, switchLocaleInPath } from "@utils/locale-utils";

const languages = getSupportedLanguages() as Array<{
	code: SiteLocale;
	label: string;
	dir: "ltr" | "rtl";
}>;

export default function LanguageSwitcher() {
	const [currentLang, setCurrentLang] = useState<SiteLocale>("en");
	const [panelOpen, setPanelOpen] = useState(false);

	useEffect(() => {
		setCurrentLang(getStoredLang() as SiteLocale);
		applyStoredLanguage();
	}, []);

	function switchLang(code: SiteLocale) {
		setCurrentLang(code);
		setStoredLang(code);
		const targetPath = switchLocaleInPath(
			`${window.location.pathname}${window.location.search}${window.location.hash}`,
			code,
		);
		window.location.assign(targetPath);
		setPanelOpen(false);
	}

	return (
		<div
			className="relative z-50"
			role="menu"
			tabIndex={-1}
			onMouseLeave={() => setPanelOpen(false)}
		>
			<button
				aria-label="Switch Language"
				role="menuitem"
				className="btn-plain scale-animation rounded-lg h-11 w-11 active:scale-90 text-sm font-bold"
				onMouseEnter={() => setPanelOpen(true)}
				onClick={() => setPanelOpen((open) => !open)}
			>
				<MdTranslate className="text-[1.25rem]" aria-hidden="true" />
			</button>

			<div
				className={`hidden lg:block absolute transition top-11 pt-5 ltr:right-0 rtl:left-0 ${
					panelOpen ? "" : "float-panel-closed"
				}`}
			>
				<div className="card-base float-panel p-2 min-w-[9rem]">
					{languages.map((lang) => (
						<button
							key={lang.code}
							className={`flex transition whitespace-nowrap items-center w-full btn-plain scale-animation rounded-lg h-9 px-3 font-medium active:scale-95 mb-0.5 gap-2 ${
								currentLang === lang.code ? "current-theme-btn" : ""
							}`}
							onClick={() => switchLang(lang.code)}
							dir={lang.dir}
						>
							<span className="text-sm">{lang.label}</span>
						</button>
					))}
				</div>
			</div>

			<div
				className={`lg:hidden absolute transition top-11 pt-2 ltr:right-0 rtl:left-0 ${
					panelOpen ? "" : "float-panel-closed"
				}`}
			>
				<div className="card-base float-panel p-2 min-w-[9rem] shadow-2xl">
					{languages.map((lang) => (
						<button
							key={lang.code}
							className={`flex transition whitespace-nowrap items-center w-full btn-plain scale-animation rounded-lg h-9 px-3 font-medium active:scale-95 mb-0.5 gap-2 ${
								currentLang === lang.code ? "current-theme-btn" : ""
							}`}
							onClick={() => switchLang(lang.code)}
							dir={lang.dir}
						>
							<span className="text-sm">{lang.label}</span>
						</button>
					))}
				</div>
			</div>
		</div>
	);
}
