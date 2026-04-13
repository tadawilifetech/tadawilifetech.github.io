<script lang="ts">
import Icon from "@iconify/svelte";
import {
	applyStoredLanguage,
	getStoredLang,
	getSupportedLanguages,
	setStoredLang,
} from "@utils/lang-utils";
import { type SiteLocale, switchLocaleInPath } from "@utils/locale-utils";
import { onMount } from "svelte";

interface Props {}

let {}: Props = $props();

const languages = getSupportedLanguages() as Array<{
	code: SiteLocale;
	label: string;
	dir: "ltr" | "rtl";
}>;
let currentLang = $state<SiteLocale>("en");
let panelOpen = $state(false);

onMount(() => {
	currentLang = getStoredLang() as SiteLocale;
	applyStoredLanguage();
});

function switchLang(code: SiteLocale) {
	currentLang = code;
	setStoredLang(code);
	const targetPath = switchLocaleInPath(
		`${window.location.pathname}${window.location.search}${window.location.hash}`,
		code,
	);
	window.location.assign(targetPath);
	panelOpen = false;
}

function showPanel() {
	panelOpen = true;
}

function hidePanel() {
	panelOpen = false;
}

function getCurrentLabel(): string {
	const lang = languages.find((l) => l.code === currentLang);
	return lang ? lang.code.toUpperCase() : "EN";
}
</script>

<div class="relative z-50" role="menu" tabindex="-1" onmouseleave={hidePanel}>
	<button
		aria-label="Switch Language"
		role="menuitem"
		class="btn-plain scale-animation rounded-lg h-11 w-11 active:scale-90 text-sm font-bold"
		onmouseenter={showPanel}
		onclick={() => (panelOpen = !panelOpen)}
	>
		<Icon icon="material-symbols:translate-rounded" class="text-[1.25rem]" />
	</button>

	<div
		class="hidden lg:block absolute transition top-11 pt-5 ltr:right-0 rtl:left-0"
		class:float-panel-closed={!panelOpen}
	>
		<div class="card-base float-panel p-2 min-w-[9rem]">
			{#each languages as lang}
				<button
					class="flex transition whitespace-nowrap items-center w-full btn-plain scale-animation rounded-lg h-9 px-3 font-medium active:scale-95 mb-0.5 gap-2"
					class:current-theme-btn={currentLang === lang.code}
					onclick={() => switchLang(lang.code)}
					dir={lang.dir}
				>
					<span class="text-sm">{lang.label}</span>
				</button>
			{/each}
		</div>
	</div>

	<!-- Mobile dropdown -->
	<div
		class="lg:hidden absolute transition top-11 pt-2 ltr:right-0 rtl:left-0"
		class:float-panel-closed={!panelOpen}
	>
		<div class="card-base float-panel p-2 min-w-[9rem] shadow-2xl">
			{#each languages as lang}
				<button
					class="flex transition whitespace-nowrap items-center w-full btn-plain scale-animation rounded-lg h-9 px-3 font-medium active:scale-95 mb-0.5 gap-2"
					class:current-theme-btn={currentLang === lang.code}
					onclick={() => switchLang(lang.code)}
					dir={lang.dir}
				>
					<span class="text-sm">{lang.label}</span>
				</button>
			{/each}
		</div>
	</div>
</div>
