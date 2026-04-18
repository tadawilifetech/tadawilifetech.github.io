import { useEffect, useState } from "react";
import { FaArrowRotateLeft } from "react-icons/fa6";
import I18nKey from "@i18n/i18nKey";
import { i18n } from "@i18n/translation";
import { applyStoredLanguage } from "@utils/lang-utils";
import { getDefaultHue, getHue, setHue } from "@utils/setting-utils";

export default function DisplaySettings() {
	const [hue, setHueState] = useState(0);
	const [defaultHue, setDefaultHue] = useState(0);

	useEffect(() => {
		setHueState(getHue());
		setDefaultHue(getDefaultHue());
		applyStoredLanguage();
	}, []);

	useEffect(() => {
		setHue(hue);
	}, [hue]);

	return (
		<div
			id="display-setting"
			className="float-panel float-panel-closed absolute transition-all w-80 ltr:right-4 rtl:left-4 px-4 py-4"
		>
			<div className="flex flex-row gap-2 mb-3 items-center justify-between">
				<div
					className="flex gap-2 font-bold text-lg text-neutral-900 dark:text-neutral-100 transition relative ms-3 before:w-1 before:h-4 before:rounded-md before:bg-[var(--primary)] before:absolute ltr:before:-left-3 rtl:before:-right-3 before:top-[0.33rem]"
				>
					<span data-i18n="themeColor">{i18n(I18nKey.themeColor)}</span>
					<button
						aria-label="Reset to Default"
						className={`btn-regular w-7 h-7 rounded-md active:scale-90 will-change-transform ${
							hue === defaultHue ? "opacity-0 pointer-events-none" : ""
						}`}
						onClick={() => setHueState(getDefaultHue())}
					>
						<div className="text-[var(--btn-content)]">
							<FaArrowRotateLeft
								className="text-[0.875rem]"
								aria-hidden="true"
							/>
						</div>
					</button>
				</div>
				<div className="flex gap-1">
					<div
						id="hueValue"
						className="transition bg-[var(--btn-regular-bg)] w-10 h-7 rounded-md flex justify-center font-bold text-sm items-center text-[var(--btn-content)]"
					>
						{hue}
					</div>
				</div>
			</div>
			<div className="w-full h-6 px-1 bg-[oklch(0.80_0.10_0)] dark:bg-[oklch(0.70_0.10_0)] rounded select-none">
				<input
					aria-label={i18n(I18nKey.themeColor)}
					data-i18n-placeholder="themeColor"
					type="range"
					min="0"
					max="360"
					value={hue}
					onChange={(event) => setHueState(Number.parseInt(event.target.value, 10))}
					className="slider"
					id="colorSlider"
					step="5"
					style={{ width: "100%" }}
				/>
			</div>
		</div>
	);
}
