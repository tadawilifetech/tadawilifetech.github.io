import type { Localized } from "./site-nav";

export type ProductGroup = "sleep" | "orthopedic";

export const PRODUCT_GROUPS: Record<
	ProductGroup,
	{ label: Localized; tagline: Localized; icon: string }
> = {
	sleep: {
		label: {
			en: "Sleep Apnea Products",
			ar: "منتجات انقطاع النفس أثناء النوم",
			fa: "محصولات آپنه خواب",
		},
		tagline: {
			en: "CPAP & BiPAP devices, masks, home sleep testing and oral appliances",
			ar: "أجهزة CPAP و BiPAP والأقنعة ودراسة النوم المنزلية وأجهزة الفم",
			fa: "دستگاه‌های CPAP و BiPAP، ماسک‌ها، تست خواب در منزل و ابزارهای دهانی",
		},
		icon: "material-symbols:bedtime-outline-rounded",
	},
	orthopedic: {
		label: {
			en: "Orthopedic Braces",
			ar: "دعامات العظام",
			fa: "بریس‌های ارتوپدی",
		},
		tagline: {
			en: "Ortino back, knee, foot & ankle and hand & wrist orthoses",
			ar: "دعامات Ortino للظهر والركبة والقدم والكاحل واليد والمعصم",
			fa: "ارتزهای اورتینو برای کمر، زانو، پا و مچ پا، دست و مچ دست",
		},
		icon: "material-symbols:accessibility-new-rounded",
	},
};

export const ORTHO_FAMILIES: {
	key: string;
	icon: string;
	label: Localized;
	desc: Localized;
}[] = [
	{
		key: "back-spine",
		icon: "material-symbols:airline-seat-recline-normal-rounded",
		label: {
			en: "Back & Spine Braces",
			ar: "دعامات الظهر والعمود الفقري",
			fa: "کمربند طبی و ارتزهای ستون فقرات",
		},
		desc: {
			en: "LO, LSO, TLSO, Spinomed & posture support",
			ar: "LO و LSO و TLSO و Spinomed ودعم القوام",
			fa: "LO، LSO، TLSO، اسپاینومد و قوزبند",
		},
	},
	{
		key: "knee",
		icon: "material-symbols:directions-walk-rounded",
		label: { en: "Knee Braces", ar: "دعامات الركبة", fa: "زانوبند طبی" },
		desc: {
			en: "Rehab, ligament, unloader & post-op",
			ar: "التأهيل والأربطة وتخفيف الحمل وما بعد الجراحة",
			fa: "توانبخشی، رباط، آنلودر و بعد از عمل",
		},
	},
	{
		key: "foot-ankle",
		icon: "material-symbols:footprint",
		label: {
			en: "Foot & Ankle Orthoses",
			ar: "أجهزة تقويم القدم والكاحل",
			fa: "ارتزهای پا و مچ پا",
		},
		desc: {
			en: "Malleo, patella & foot drop",
			ar: "Malleo والرضفة وتدلّي القدم",
			fa: "مالئو، کشکک و فوت دراپ",
		},
	},
	{
		key: "hand-wrist",
		icon: "material-symbols:back-hand-outline-rounded",
		label: {
			en: "Hand & Wrist Orthoses",
			ar: "أجهزة تقويم اليد والمعصم",
			fa: "ارتزهای دست و آرنج",
		},
		desc: {
			en: "Wrist, thumb & elbow support",
			ar: "دعم المعصم والإبهام والكوع",
			fa: "مچ‌بند، شست‌بند و آرنج‌بند",
		},
	},
];

/** General orthopedic FAQ (adapted from ortino.ir). */
export const ORTHOPEDIC_FAQ: Record<string, { q: string; a: string }[]> = {
	en: [
		{
			q: "What is the difference between Ortino and Ortino Plus products?",
			a: "Ortino products are general-use supports. Ortino Plus products are specialist orthoses that must be fitted and adjusted by an orthotist.",
		},
		{
			q: "How are Ortino products different from other orthopedic supports?",
			a: "Orthopedic supports fall into general products — mostly elastic and fabric, sold in pharmacies and offering less support — and specialist products. Ortino’s advanced range is specialist-grade, designed on the Aspen (USA) platform using premium polymer and textile materials.",
		},
		{
			q: "What materials are Ortino products made of?",
			a: "Advanced, unbreakable polyamide; non-stretch mesh and breathable fabrics; long-life Velcro; breathable Spanish polyurethane foam; and specialist-grade aluminium.",
		},
		{
			q: "Should I see a doctor before buying a back brace?",
			a: "Yes — if your back pain is acute or chronic, consult a specialist physician before using a brace.",
		},
		{
			q: "How do I order?",
			a: "Add the product to your cart and send the order via WhatsApp, or contact our team on +968 91235160. We deliver across Oman.",
		},
		{
			q: "Are Ortino products certified?",
			a: "Ortino products hold ISO 13485, ISO 9001, CE marking and GMP certification.",
		},
	],
	ar: [
		{
			q: "ما الفرق بين منتجات Ortino و Ortino Plus؟",
			a: "منتجات Ortino للاستخدام العام، أما منتجات Ortino Plus فهي أجهزة تقويم تخصصية يجب أن يركّبها ويضبطها أخصائي الأجهزة التقويمية.",
		},
		{
			q: "ما الذي يميز منتجات Ortino عن غيرها؟",
			a: "تنقسم منتجات العظام إلى منتجات عامة مصنوعة غالباً من المطاط والقماش وتوفر دعماً أقل، ومنتجات تخصصية. مجموعة Ortino المتطورة تخصصية ومصممة على منصة Aspen الأمريكية بخامات بوليمرية ونسيجية ممتازة.",
		},
		{
			q: "مما تُصنع منتجات Ortino؟",
			a: "من البولي أميد المتطور غير القابل للكسر، وأقمشة شبكية غير مطاطية وأقمشة قابلة للتنفس، وفيلكرو طويل العمر، وإسفنج بولي يوريثان إسباني قابل للتنفس، وألومنيوم تخصصي.",
		},
		{
			q: "هل يجب استشارة الطبيب قبل شراء دعامة الظهر؟",
			a: "نعم، إذا كان ألم الظهر حاداً أو مزمناً فاستشر طبيباً مختصاً قبل استخدام الدعامة.",
		},
		{
			q: "كيف أطلب؟",
			a: "أضف المنتج إلى السلة وأرسل الطلب عبر واتساب، أو تواصل مع فريقنا على ‎+968 91235160. نوصل إلى جميع أنحاء عُمان.",
		},
		{
			q: "هل منتجات Ortino معتمدة؟",
			a: "تحمل منتجات Ortino شهادات ISO 13485 و ISO 9001 وعلامة CE وشهادة GMP.",
		},
	],
	fa: [
		{
			q: "تفاوت محصولات اورتینو با اورتینو پلاس چیست؟",
			a: "محصولات اورتینو جنبه عمومی دارند. اما محصولات اورتینو پلاس تخصصی بوده و باید توسط درمانگر ارتزیست نصب و تنظیم شوند.",
		},
		{
			q: "تفاوت محصولات اورتینو با سایر محصولات ارتوپدی چیست؟",
			a: "بصورت کلی محصولات ارتوپدی به دو دسته عمومی و تخصصی تقسیم می‌شوند. محصولات عمومی که عمدتاً از کش و پارچه ساخته شده‌اند حمایت کمتری از اندام بدن دارند. محصولات پیشرفته ارتوپدی اورتینو از نوع تخصصی هستند؛ طراحی بر پایه پلتفرم کمپانی اِکسوز آمریکا و استفاده از متریال درجه یک پلیمری و پارچه‌ای از مزایای این محصولات است.",
		},
		{
			q: "محصولات اورتینو از چه موادی ساخته شده‌اند؟",
			a: "در تولید این محصولات از پیشرفته‌ترین مواد پلی‌آمید و کاملاً نشکن، پارچه‌های توری غیرکشسان، پارچه‌های تنفسی، ولکروهای باکیفیت و با طول عمر بالا، اسفنج‌های تنفسی پلی‌یورتان اسپانیایی و آلومینیوم گرید تخصصی استفاده شده است.",
		},
		{
			q: "آیا قبل از خرید کمربندهای طبی اورتینو باید با پزشک مشورت کرد؟",
			a: "در صورتی که عارضه و کمردرد شما حاد و مزمن است حتماً با پزشک متخصص مشورت کنید.",
		},
		{
			q: "روش سفارش محصولات چگونه است؟",
			a: "محصول را به سبد خرید اضافه کنید و سفارش را از طریق واتساپ ارسال کنید یا با شماره ‎+968 91235160 تماس بگیرید. ارسال به سراسر عمان انجام می‌شود.",
		},
		{
			q: "آیا محصولات اورتینو دارای گواهی هستند؟",
			a: "محصولات اورتینو دارای نشان ISO13485، ISO9001، نشان CE اروپا و گواهی تولید در شرایط پاکیزه (GMP) هستند.",
		},
	],
};
