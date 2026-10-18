import type { SiteLocale } from "@utils/locale-utils";

export type Localized = Record<SiteLocale, string>;

export type SiteNavItem = {
	key: string;
	href: string;
	icon: string;
	/** Items sharing a group render as one dropdown on desktop. */
	group?: "learn" | "services";
	label: Localized;
	desc: Localized;
};

export const NAV_GROUPS: Record<
	NonNullable<SiteNavItem["group"]>,
	{ label: Localized; icon: string }
> = {
	learn: {
		label: { en: "Learn", ar: "تعلّم", fa: "آموزش" },
		icon: "material-symbols:school-outline-rounded",
	},
	services: {
		label: { en: "Services", ar: "الخدمات", fa: "خدمات" },
		icon: "material-symbols:medical-services-outline-rounded",
	},
};

/** Toolbar order defined in Website.md (item 1). */
export const SITE_NAV: SiteNavItem[] = [
	{
		key: "home",
		href: "/",
		icon: "material-symbols:home-outline-rounded",
		label: { en: "Home", ar: "الرئيسية", fa: "خانه" },
		desc: {
			en: "Products & solutions",
			ar: "المنتجات والحلول",
			fa: "محصولات و راهکارها",
		},
	},
	{
		key: "sleep-assessment",
		href: "/sleep-assessment/",
		icon: "material-symbols:bedtime-outline-rounded",
		label: { en: "Sleep Assessment", ar: "تقييم النوم", fa: "ارزیابی خواب" },
		desc: {
			en: "Check your sleep apnea risk in minutes",
			ar: "قيّم خطر انقطاع النفس أثناء النوم خلال دقائق",
			fa: "ریسک آپنه خواب خود را در چند دقیقه بسنجید",
		},
	},
	{
		key: "sleep-therapy-academy",
		href: "/sleep-therapy-academy/",
		icon: "material-symbols:school-outline-rounded",
		group: "learn",
		label: {
			en: "Sleep Therapy Academy",
			ar: "أكاديمية علاج النوم",
			fa: "آکادمی درمان خواب",
		},
		desc: {
			en: "CPAP & BiPAP education and patient support",
			ar: "تثقيف ودعم مرضى CPAP و BiPAP",
			fa: "آموزش و پشتیبانی بیماران CPAP و BiPAP",
		},
	},
	{
		key: "understanding-cpap-therapy",
		href: "/understanding-cpap-therapy/",
		icon: "material-symbols:air-rounded",
		group: "learn",
		label: {
			en: "Understanding CPAP Therapy",
			ar: "فهم علاج CPAP",
			fa: "آشنایی با درمان CPAP",
		},
		desc: {
			en: "CPAP, BiPAP, MAD & sleep study reports",
			ar: "CPAP و BiPAP وأجهزة الفك وتقارير دراسة النوم",
			fa: "CPAP، BiPAP، MAD و گزارش‌های تست خواب",
		},
	},
	{
		key: "training-resources",
		href: "/training-resources/",
		icon: "material-symbols:smart-display-outline-rounded",
		group: "learn",
		label: {
			en: "Training Resources",
			ar: "مصادر التدريب",
			fa: "منابع آموزشی",
		},
		desc: {
			en: "Step-by-step device videos",
			ar: "فيديوهات تعليمية للأجهزة خطوة بخطوة",
			fa: "ویدیوهای آموزشی گام‌به‌گام دستگاه‌ها",
		},
	},
	{
		key: "medical-evidence",
		href: "/medical-evidence/",
		icon: "material-symbols:biotech-outline-rounded",
		group: "learn",
		label: { en: "Medical Evidence", ar: "الأدلة الطبية", fa: "شواهد پزشکی" },
		desc: {
			en: "Clinical studies & scientific references",
			ar: "الدراسات السريرية والمراجع العلمية",
			fa: "مطالعات بالینی و منابع علمی",
		},
	},
	{
		key: "healthcare-professionals",
		href: "/healthcare-professionals/",
		icon: "material-symbols:stethoscope-rounded",
		group: "services",
		label: {
			en: "Healthcare Professionals",
			ar: "مقدمو الرعاية الصحية",
			fa: "متخصصان سلامت",
		},
		desc: {
			en: "Online referral form & patient data portal",
			ar: "نموذج الإحالة الإلكتروني وبوابة بيانات المرضى",
			fa: "فرم ارجاع آنلاین و پورتال داده بیماران",
		},
	},
	{
		key: "device-registration",
		href: "/device-registration/",
		icon: "material-symbols:app-registration-rounded",
		group: "services",
		label: { en: "Device Registration", ar: "تسجيل الجهاز", fa: "ثبت دستگاه" },
		desc: {
			en: "Register your device for support",
			ar: "سجّل جهازك للحصول على الدعم",
			fa: "دستگاه خود را برای پشتیبانی ثبت کنید",
		},
	},
	{
		key: "community-health",
		href: "/community-health/",
		icon: "material-symbols:diversity-3-rounded",
		group: "services",
		label: {
			en: "Community Health Programs & Partnerships",
			ar: "برامج صحة المجتمع والشراكات",
			fa: "برنامه‌های سلامت جامعه و همکاری‌ها",
		},
		desc: {
			en: "Awareness programs & collaboration",
			ar: "برامج التوعية والتعاون",
			fa: "برنامه‌های آگاهی‌بخشی و همکاری",
		},
	},
	{
		key: "blog",
		href: "/blog/",
		icon: "material-symbols:article-outline-rounded",
		label: { en: "Blog", ar: "المدونة", fa: "وبلاگ" },
		desc: {
			en: "Articles & guides",
			ar: "مقالات وأدلة",
			fa: "مقالات و راهنماها",
		},
	},
	{
		key: "about",
		href: "/about/",
		icon: "material-symbols:info-outline-rounded",
		label: { en: "About", ar: "من نحن", fa: "درباره ما" },
		desc: { en: "Who we are", ar: "من نحن", fa: "ما که هستیم" },
	},
	{
		key: "contact",
		href: "/contact/",
		icon: "material-symbols:call-outline-rounded",
		label: { en: "Contact", ar: "اتصل بنا", fa: "تماس با ما" },
		desc: { en: "Get in touch", ar: "تواصل معنا", fa: "با ما در ارتباط باشید" },
	},
];

/** Feature pages rendered by the `[section]` routes. */
export const SECTION_KEYS = [
	"sleep-assessment",
	"sleep-therapy-academy",
	"understanding-cpap-therapy",
	"training-resources",
	"medical-evidence",
	"healthcare-professionals",
	"device-registration",
	"community-health",
	"orthopedic-catalog",
] as const;

export type SectionKey = (typeof SECTION_KEYS)[number];

export function navItem(key: string): SiteNavItem | undefined {
	return SITE_NAV.find((item) => item.key === key);
}

/** Group consecutive items so dropdowns keep the Website.md order. */
export function groupedNav(): Array<
	| SiteNavItem
	| { group: NonNullable<SiteNavItem["group"]>; items: SiteNavItem[] }
> {
	const out: Array<
		| SiteNavItem
		| { group: NonNullable<SiteNavItem["group"]>; items: SiteNavItem[] }
	> = [];
	for (const item of SITE_NAV) {
		const last = out[out.length - 1];
		if (item.group && last && "items" in last && last.group === item.group) {
			last.items.push(item);
		} else if (item.group) {
			out.push({ group: item.group, items: [item] });
		} else {
			out.push(item);
		}
	}
	return out;
}
