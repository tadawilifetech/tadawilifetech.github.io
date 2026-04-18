import { useEffect, useRef, useState } from "react";
import { FaChevronRight } from "react-icons/fa6";
import { MdOutlineSearch } from "react-icons/md";
import I18nKey from "@i18n/i18nKey";
import { i18n } from "@i18n/translation";
import { applyStoredLanguage } from "@utils/lang-utils";
import { url } from "@utils/url-utils.ts";
import type { SearchResult } from "@/global";

const fakeResult: SearchResult[] = [
	{
		url: url("/"),
		meta: {
			title: "This Is a Fake Search Result",
		},
		excerpt:
			"Because the search cannot work in the <mark>dev</mark> environment.",
	},
	{
		url: url("/"),
		meta: {
			title: "If You Want to Test the Search",
		},
		excerpt: "Try running <mark>npm build && npm preview</mark> instead.",
	},
];

export default function Search() {
	const [keywordDesktop, setKeywordDesktop] = useState("");
	const [keywordMobile, setKeywordMobile] = useState("");
	const [result, setResult] = useState<SearchResult[]>([]);
	const [initialized, setInitialized] = useState(false);
	const [pagefindLoaded, setPagefindLoaded] = useState(false);
	const [isSearching, setIsSearching] = useState(false);
	const initializedRef = useRef(false);
	const pagefindLoadedRef = useRef(false);

	const setPanelVisibility = (show: boolean, isDesktop: boolean): void => {
		const panel = document.getElementById("search-panel");
		if (!panel || !isDesktop) return;

		if (show) {
			panel.classList.remove("float-panel-closed");
		} else {
			panel.classList.add("float-panel-closed");
		}
	};

	const search = async (keyword: string, isDesktop: boolean): Promise<void> => {
		if (!keyword) {
			setPanelVisibility(false, isDesktop);
			setResult([]);
			return;
		}

		if (!initializedRef.current) {
			return;
		}

		setIsSearching(true);

		const searchRequest =
			import.meta.env.PROD && pagefindLoadedRef.current && window.pagefind
				? window.pagefind
						.search(keyword)
						.then((response) =>
							Promise.all(response.results.map((item) => item.data())),
						)
				: import.meta.env.DEV
					? Promise.resolve(fakeResult)
					: Promise.resolve([]);

		if (!import.meta.env.DEV && (!pagefindLoadedRef.current || !window.pagefind)) {
			console.error("Pagefind is not available in production environment.");
		}

		try {
			const searchResults = await searchRequest;
			setResult(searchResults);
			setPanelVisibility(searchResults.length > 0, isDesktop);
		} catch (error) {
			console.error("Search error:", error);
			setResult([]);
			setPanelVisibility(false, isDesktop);
		} finally {
			setIsSearching(false);
		}
	};

	useEffect(() => {
		applyStoredLanguage();

		const initializeSearch = () => {
			initializedRef.current = true;
			pagefindLoadedRef.current =
				typeof window !== "undefined" &&
				!!window.pagefind &&
				typeof window.pagefind.search === "function";
			setInitialized(true);
			setPagefindLoaded(pagefindLoadedRef.current);
			if (keywordDesktop) void search(keywordDesktop, true);
			if (keywordMobile) void search(keywordMobile, false);
		};

		if (import.meta.env.DEV) {
			console.log(
				"Pagefind is not available in development mode. Using mock data.",
			);
			initializeSearch();
			return;
		}

		const onReady = () => {
			console.log("Pagefind ready event received.");
			initializeSearch();
		};
		const onError = () => {
			console.warn(
				"Pagefind load error event received. Search functionality will be limited.",
			);
			initializeSearch();
		};

		document.addEventListener("pagefindready", onReady);
		document.addEventListener("pagefindloaderror", onError);

		const timeoutId = window.setTimeout(() => {
			if (!initializedRef.current) {
				console.log("Fallback: Initializing search after timeout.");
				initializeSearch();
			}
		}, 2000);

		return () => {
			document.removeEventListener("pagefindready", onReady);
			document.removeEventListener("pagefindloaderror", onError);
			window.clearTimeout(timeoutId);
		};
	}, []);

	useEffect(() => {
		if (!initialized) {
			return;
		}
		void search(keywordDesktop, true);
	}, [initialized, keywordDesktop]);

	useEffect(() => {
		if (!initialized) {
			return;
		}
		void search(keywordMobile, false);
	}, [initialized, keywordMobile]);

	return (
		<>
			<div
				id="search-bar"
				className="hidden lg:flex transition-all items-center h-11 ltr:mr-2 rtl:ml-2 rounded-lg bg-black/[0.04] hover:bg-black/[0.06] focus-within:bg-black/[0.06] dark:bg-white/5 dark:hover:bg-white/10 dark:focus-within:bg-white/10"
			>
				<MdOutlineSearch
					className="absolute text-[1.25rem] pointer-events-none ltr:ml-3 rtl:mr-3 transition my-auto text-black/30 dark:text-white/30"
					aria-hidden="true"
				/>
				<input
					placeholder={i18n(I18nKey.search)}
					data-i18n-placeholder="search"
					value={keywordDesktop}
					onChange={(event) => setKeywordDesktop(event.target.value)}
					onFocus={() => void search(keywordDesktop, true)}
					className="transition-all ltr:pl-10 rtl:pr-10 text-sm bg-transparent outline-0 h-full w-40 active:w-60 focus:w-60 text-black/50 dark:text-white/50"
				/>
			</div>

			<button
				onClick={() =>
					document.getElementById("search-panel")?.classList.toggle("float-panel-closed")
				}
				aria-label="Search Panel"
				id="search-switch"
				className="btn-plain scale-animation lg:!hidden rounded-lg w-11 h-11 active:scale-90"
			>
				<MdOutlineSearch className="text-[1.25rem]" aria-hidden="true" />
			</button>

			<div
				id="search-panel"
				className="float-panel float-panel-closed search-panel absolute md:w-[30rem] top-20 ltr:left-4 ltr:md:left-[unset] ltr:right-4 rtl:right-4 rtl:md:right-[unset] rtl:left-4 shadow-2xl rounded-2xl p-2"
				data-pagefind-loaded={pagefindLoaded}
				data-searching={isSearching}
			>
				<div
					id="search-bar-inside"
					className="flex relative lg:hidden transition-all items-center h-11 rounded-xl bg-black/[0.04] hover:bg-black/[0.06] focus-within:bg-black/[0.06] dark:bg-white/5 dark:hover:bg-white/10 dark:focus-within:bg-white/10"
				>
					<MdOutlineSearch
						className="absolute text-[1.25rem] pointer-events-none ltr:ml-3 rtl:mr-3 transition my-auto text-black/30 dark:text-white/30"
						aria-hidden="true"
					/>
					<input
						placeholder="Search"
						data-i18n-placeholder="search"
						value={keywordMobile}
						onChange={(event) => setKeywordMobile(event.target.value)}
						className="ltr:pl-10 rtl:pr-10 absolute inset-0 text-sm bg-transparent outline-0 focus:w-60 text-black/50 dark:text-white/50"
					/>
				</div>

				{result.map((item) => (
					<a
						key={`${item.url}-${item.meta.title}`}
						href={item.url}
						className="transition first-of-type:mt-2 lg:first-of-type:mt-0 group block rounded-xl text-lg px-3 py-2 hover:bg-[var(--btn-plain-bg-hover)] active:bg-[var(--btn-plain-bg-active)]"
					>
						<div className="transition text-90 inline-flex font-bold group-hover:text-[var(--primary)]">
							{item.meta.title}
							<FaChevronRight
								className="transition text-[0.75rem] translate-x-1 my-auto text-[var(--primary)]"
								aria-hidden="true"
							/>
						</div>
						<div
							className="transition text-sm text-50"
							dangerouslySetInnerHTML={{ __html: item.excerpt }}
						/>
					</a>
				))}
			</div>
		</>
	);
}
