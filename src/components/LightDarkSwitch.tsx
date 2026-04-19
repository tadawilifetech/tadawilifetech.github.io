import { useEffect, useState } from "react";
import {
	MdOutlineBrightnessAuto,
	MdOutlineDarkMode,
	MdOutlineWbSunny,
} from "react-icons/md";
import { AUTO_MODE, DARK_MODE, LIGHT_MODE } from "@constants/constants.ts";
import I18nKey from "@i18n/i18nKey";
import { i18n } from "@i18n/translation";
import { applyStoredLanguage, getStoredLang } from "@utils/lang-utils";
import {
	applyThemeToDocument,
	getStoredTheme,
	setTheme,
} from "@utils/setting-utils.ts";
import type { LIGHT_DARK_MODE } from "@/types/config.ts";

const seq: LIGHT_DARK_MODE[] = [LIGHT_MODE, DARK_MODE, AUTO_MODE];

export default function LightDarkSwitch() {
	const [mode, setMode] = useState<LIGHT_DARK_MODE>(AUTO_MODE);
	const [lang, setLang] = useState("en");

	useEffect(() => {
		setMode(getStoredTheme());
		const resolvedLang = applyStoredLanguage();
		setLang(resolvedLang);
	}, []);

	useEffect(() => {
		const darkModePreference = window.matchMedia("(prefers-color-scheme: dark)");
		const changeThemeWhenSchemeChanged = () => {
			applyThemeToDocument(mode);
		};
		darkModePreference.addEventListener("change", changeThemeWhenSchemeChanged);
		return () => {
			darkModePreference.removeEventListener(
				"change",
				changeThemeWhenSchemeChanged,
			);
		};
	}, [mode]);

	function switchScheme(newMode: LIGHT_DARK_MODE) {
		setMode(newMode);
		setTheme(newMode);
	}

	function toggleScheme() {
		const currentIndex = seq.findIndex((item) => item === mode);
		switchScheme(seq[(currentIndex + 1) % seq.length]);
	}

	return (
		<div
			className="relative z-50"
			role="menu"
			tabIndex={-1}
			onMouseLeave={() => {
				document
					.querySelector("#light-dark-panel")
					?.classList.add("float-panel-closed");
			}}
		>
			<button
				aria-label="Light/Dark Mode"
				role="menuitem"
				className="relative btn-plain scale-animation rounded-lg h-11 w-11 active:scale-90"
				id="scheme-switch"
				onClick={toggleScheme}
				onMouseEnter={() => {
					document
						.querySelector("#light-dark-panel")
						?.classList.remove("float-panel-closed");
				}}
			>
				<div className={`absolute ${mode !== LIGHT_MODE ? "opacity-0" : ""}`}>
					<MdOutlineWbSunny className="text-[1.25rem]" aria-hidden="true" />
				</div>
				<div className={`absolute ${mode !== DARK_MODE ? "opacity-0" : ""}`}>
					<MdOutlineDarkMode className="text-[1.25rem]" aria-hidden="true" />
				</div>
				<div className={`absolute ${mode !== AUTO_MODE ? "opacity-0" : ""}`}>
					<MdOutlineBrightnessAuto
						className="text-[1.25rem]"
						aria-hidden="true"
					/>
				</div>
			</button>

			<div
				id="light-dark-panel"
				className="hidden lg:block absolute transition float-panel-closed top-11 ltr:-right-2 rtl:-left-2 pt-5"
			>
				<div className="card-base float-panel p-2">
					<button
						className={`flex transition whitespace-nowrap items-center !justify-start w-full btn-plain scale-animation rounded-lg h-9 px-3 font-medium active:scale-95 mb-0.5 ${
							mode === LIGHT_MODE ? "current-theme-btn" : ""
						}`}
						onClick={() => switchScheme(LIGHT_MODE)}
					>
						<MdOutlineWbSunny
							className="text-[1.25rem] mr-3 rtl:mr-0 rtl:ml-3"
							aria-hidden="true"
						/>
						<span>{i18n(I18nKey.lightMode, lang)}</span>
					</button>
					<button
						className={`flex transition whitespace-nowrap items-center !justify-start w-full btn-plain scale-animation rounded-lg h-9 px-3 font-medium active:scale-95 mb-0.5 ${
							mode === DARK_MODE ? "current-theme-btn" : ""
						}`}
						onClick={() => switchScheme(DARK_MODE)}
					>
						<MdOutlineDarkMode
							className="text-[1.25rem] mr-3 rtl:mr-0 rtl:ml-3"
							aria-hidden="true"
						/>
						<span>{i18n(I18nKey.darkMode, lang)}</span>
					</button>
					<button
						className={`flex transition whitespace-nowrap items-center !justify-start w-full btn-plain scale-animation rounded-lg h-9 px-3 font-medium active:scale-95 ${
							mode === AUTO_MODE ? "current-theme-btn" : ""
						}`}
						onClick={() => switchScheme(AUTO_MODE)}
					>
						<MdOutlineBrightnessAuto
							className="text-[1.25rem] mr-3 rtl:mr-0 rtl:ml-3"
							aria-hidden="true"
						/>
						<span>{i18n(I18nKey.systemMode, lang)}</span>
					</button>
				</div>
			</div>
		</div>
	);
}
