import { WHATSAPP_PHONE_RAW } from "@utils/contact";
import {
	type Answers,
	type RiskLevel,
	scoreAssessment,
} from "@utils/sleep-score";
import { useEffect, useMemo, useRef, useState } from "react";
import { FaWhatsapp } from "react-icons/fa6";
import {
	MdArrowBack,
	MdArrowForward,
	MdCheck,
	MdPrint,
	MdRefresh,
} from "react-icons/md";

type Locale = "en" | "ar" | "fa";
type Choice = { key: string; label: Record<Locale, string> };
type Field =
	| {
			id: string;
			kind: "number";
			label: Record<Locale, string>;
			unit?: string;
			min: number;
			max: number;
	  }
	| {
			id: string;
			kind: "choice";
			label: Record<Locale, string>;
			options: Choice[];
	  }
	| { id: string; kind: "ess"; label: Record<Locale, string> };
type Step = {
	title: Record<Locale, string>;
	intro?: Record<Locale, string>;
	fields: Field[];
};

const yes: Choice = { key: "yes", label: { en: "Yes", ar: "نعم", fa: "بله" } };
const no: Choice = { key: "no", label: { en: "No", ar: "لا", fa: "خیر" } };
const yn = (id: string, en: string, ar: string, fa: string): Field => ({
	id,
	kind: "choice",
	label: { en, ar, fa },
	options: [no, yes],
});

const STEPS: Step[] = [
	{
		title: {
			en: "Personal Information",
			ar: "المعلومات الشخصية",
			fa: "اطلاعات فردی",
		},
		fields: [
			{
				id: "age",
				kind: "number",
				label: { en: "Age", ar: "العمر", fa: "سن" },
				min: 12,
				max: 110,
			},
			{
				id: "gender",
				kind: "choice",
				label: { en: "Gender", ar: "الجنس", fa: "جنسیت" },
				options: [
					{ key: "male", label: { en: "Male", ar: "ذكر", fa: "مرد" } },
					{ key: "female", label: { en: "Female", ar: "أنثى", fa: "زن" } },
				],
			},
			{
				id: "height",
				kind: "number",
				label: { en: "Height", ar: "الطول", fa: "قد" },
				unit: "cm",
				min: 100,
				max: 230,
			},
			{
				id: "weight",
				kind: "number",
				label: { en: "Weight", ar: "الوزن", fa: "وزن" },
				unit: "kg",
				min: 25,
				max: 300,
			},
			{
				id: "neck",
				kind: "number",
				label: { en: "Neck Circumference", ar: "محيط الرقبة", fa: "دور گردن" },
				unit: "cm",
				min: 20,
				max: 70,
			},
		],
	},
	{
		title: {
			en: "Sleep Apnea Symptoms",
			ar: "أعراض انقطاع النفس أثناء النوم",
			fa: "علائم آپنه خواب",
		},
		fields: [
			{
				id: "snore",
				kind: "choice",
				label: {
					en: "Do you snore loudly?",
					ar: "هل تشخر بصوت عالٍ؟",
					fa: "آیا با صدای بلند خروپف می‌کنید؟",
				},
				options: [
					no,
					{
						key: "sometimes",
						label: { en: "Sometimes", ar: "أحياناً", fa: "گاهی" },
					},
					{
						key: "frequently",
						label: { en: "Frequently", ar: "كثيراً", fa: "اغلب" },
					},
				],
			},
			{
				id: "observedApnea",
				kind: "choice",
				label: {
					en: "Has anyone observed that you stop breathing during sleep?",
					ar: "هل لاحظ أحد أنك تتوقف عن التنفس أثناء النوم؟",
					fa: "آیا کسی متوجه قطع تنفس شما در خواب شده است؟",
				},
				options: [
					no,
					{
						key: "notSure",
						label: { en: "Not Sure", ar: "لست متأكداً", fa: "مطمئن نیستم" },
					},
					yes,
				],
			},
			{
				id: "choking",
				kind: "choice",
				label: {
					en: "Do you wake up choking, gasping, or short of breath during the night?",
					ar: "هل تستيقظ ليلاً مختنقاً أو تلهث أو بضيق في التنفس؟",
					fa: "آیا شب‌ها با حالت خفگی، نفس‌نفس زدن یا تنگی نفس بیدار می‌شوید؟",
				},
				options: [
					no,
					{
						key: "occasionally",
						label: { en: "Occasionally", ar: "أحياناً", fa: "گاهی" },
					},
					{
						key: "frequently",
						label: { en: "Frequently", ar: "كثيراً", fa: "اغلب" },
					},
				],
			},
			yn(
				"dryMouth",
				"Do you wake up with a dry mouth?",
				"هل تستيقظ بفم جاف؟",
				"آیا با خشکی دهان بیدار می‌شوید؟",
			),
			yn(
				"headaches",
				"Do you wake up with morning headaches?",
				"هل تستيقظ بصداع صباحي؟",
				"آیا صبح‌ها با سردرد بیدار می‌شوید؟",
			),
			yn(
				"unrefreshing",
				"Do you feel your sleep is non-restorative or unrefreshing?",
				"هل تشعر أن نومك غير مريح أو لا يجدد نشاطك؟",
				"آیا احساس می‌کنید خوابتان نیروبخش نیست؟",
			),
			yn(
				"disturbsPartner",
				"Has your snoring disturbed your partner or family members?",
				"هل أزعج شخيرك شريكك أو أفراد عائلتك؟",
				"آیا خروپف شما همسر یا اعضای خانواده را آزار داده است؟",
			),
			{
				id: "awakenings",
				kind: "choice",
				label: {
					en: "How many times do you usually wake up during the night?",
					ar: "كم مرة تستيقظ عادةً خلال الليل؟",
					fa: "معمولاً چند بار در طول شب بیدار می‌شوید؟",
				},
				options: [
					{ key: "none", label: { en: "None", ar: "لا أستيقظ", fa: "هیچ" } },
					{
						key: "oneTwo",
						label: { en: "1–2 times", ar: "1–2 مرة", fa: "۱ تا ۲ بار" },
					},
					{
						key: "threePlus",
						label: {
							en: "3 or more times",
							ar: "3 مرات أو أكثر",
							fa: "۳ بار یا بیشتر",
						},
					},
				],
			},
		],
	},
	{
		title: {
			en: "Daytime Sleepiness Assessment",
			ar: "تقييم النعاس أثناء النهار",
			fa: "ارزیابی خواب‌آلودگی روزانه",
		},
		intro: {
			en: "How likely are you to doze off in the following situations?",
			ar: "ما مدى احتمال أن تغفو في المواقف التالية؟",
			fa: "در موقعیت‌های زیر چقدر احتمال دارد چرت بزنید؟",
		},
		fields: [
			{
				id: "ess1",
				kind: "ess",
				label: {
					en: "Sitting and reading",
					ar: "الجلوس والقراءة",
					fa: "نشستن و مطالعه",
				},
			},
			{
				id: "ess2",
				kind: "ess",
				label: {
					en: "Watching television",
					ar: "مشاهدة التلفاز",
					fa: "تماشای تلویزیون",
				},
			},
			{
				id: "ess3",
				kind: "ess",
				label: {
					en: "Sitting inactive in a public place",
					ar: "الجلوس دون نشاط في مكان عام",
					fa: "نشستن بی‌تحرک در مکان عمومی",
				},
			},
			{
				id: "ess4",
				kind: "ess",
				label: {
					en: "As a passenger in a car for one hour",
					ar: "راكباً في سيارة لمدة ساعة",
					fa: "مسافر خودرو به مدت یک ساعت",
				},
			},
			{
				id: "ess5",
				kind: "ess",
				label: {
					en: "Lying down to rest in the afternoon",
					ar: "الاستلقاء للراحة بعد الظهر",
					fa: "دراز کشیدن برای استراحت بعدازظهر",
				},
			},
			{
				id: "ess6",
				kind: "ess",
				label: {
					en: "Sitting and talking to someone",
					ar: "الجلوس والتحدث مع شخص",
					fa: "نشستن و صحبت با کسی",
				},
			},
			{
				id: "ess7",
				kind: "ess",
				label: {
					en: "Sitting quietly after lunch",
					ar: "الجلوس بهدوء بعد الغداء",
					fa: "نشستن آرام بعد از ناهار",
				},
			},
			{
				id: "ess8",
				kind: "ess",
				label: {
					en: "While driving or stopped in traffic",
					ar: "أثناء القيادة أو التوقف في الزحام",
					fa: "هنگام رانندگی یا توقف در ترافیک",
				},
			},
			yn(
				"fatigue",
				"Do you often feel tired or fatigued despite adequate sleep?",
				"هل تشعر غالباً بالتعب رغم النوم الكافي؟",
				"آیا با وجود خواب کافی اغلب احساس خستگی می‌کنید؟",
			),
			yn(
				"fellAsleep",
				"Have you unintentionally fallen asleep during the daytime?",
				"هل غفوت دون قصد أثناء النهار؟",
				"آیا در طول روز ناخواسته به خواب رفته‌اید؟",
			),
		],
	},
	{
		title: {
			en: "Medical Conditions",
			ar: "الحالات الطبية",
			fa: "شرایط پزشکی",
		},
		fields: [
			yn(
				"hypertension",
				"Do you have high blood pressure?",
				"هل لديك ارتفاع في ضغط الدم؟",
				"آیا فشار خون بالا دارید؟",
			),
			yn(
				"diabetes",
				"Do you have diabetes?",
				"هل لديك السكري؟",
				"آیا دیابت دارید؟",
			),
			yn(
				"heartDisease",
				"Do you have heart disease?",
				"هل لديك مرض في القلب؟",
				"آیا بیماری قلبی دارید؟",
			),
			yn(
				"arrhythmia",
				"Do you have an irregular heartbeat?",
				"هل لديك عدم انتظام في ضربات القلب؟",
				"آیا ضربان قلب نامنظم دارید؟",
			),
			yn(
				"heartAttackStroke",
				"Have you ever had a heart attack or stroke?",
				"هل أصبت سابقاً بنوبة قلبية أو سكتة دماغية؟",
				"آیا تاکنون سکته قلبی یا مغزی داشته‌اید؟",
			),
			yn(
				"heartFailureLung",
				"Do you have heart failure or chronic lung disease?",
				"هل لديك قصور في القلب أو مرض رئوي مزمن؟",
				"آیا نارسایی قلبی یا بیماری مزمن ریوی دارید؟",
			),
			yn("asthma", "Do you have asthma?", "هل لديك الربو؟", "آیا آسم دارید؟"),
			yn(
				"nasalBlockage",
				"Do you have chronic nasal blockage?",
				"هل لديك انسداد مزمن في الأنف؟",
				"آیا گرفتگی مزمن بینی دارید؟",
			),
			yn(
				"reflux",
				"Do you suffer from acid reflux or heartburn?",
				"هل تعاني من ارتجاع المريء أو حرقة المعدة؟",
				"آیا از رفلاکس اسید یا سوزش معده رنج می‌برید؟",
			),
			yn(
				"hypothyroidism",
				"Do you have hypothyroidism?",
				"هل لديك قصور في الغدة الدرقية؟",
				"آیا کم‌کاری تیروئید دارید؟",
			),
		],
	},
	{
		title: {
			en: "Lifestyle & Risk Factors",
			ar: "نمط الحياة وعوامل الخطر",
			fa: "سبک زندگی و عوامل خطر",
		},
		fields: [
			yn(
				"weightGain",
				"Have you gained weight during the past year?",
				"هل زاد وزنك خلال العام الماضي؟",
				"آیا در یک سال گذشته وزن اضافه کرده‌اید؟",
			),
			yn(
				"smoking",
				"Do you currently smoke, vape, or use shisha?",
				"هل تدخن حالياً أو تستخدم السجائر الإلكترونية أو الشيشة؟",
				"آیا در حال حاضر سیگار، ویپ یا قلیان مصرف می‌کنید؟",
			),
			yn(
				"shiftWork",
				"Do you work night shifts or rotating shifts?",
				"هل تعمل في نوبات ليلية أو متناوبة؟",
				"آیا شیفت شب یا شیفت چرخشی کار می‌کنید؟",
			),
			yn(
				"familyHistory",
				"Is there a family history of sleep apnea?",
				"هل يوجد تاريخ عائلي لانقطاع النفس أثناء النوم؟",
				"آیا سابقه خانوادگی آپنه خواب وجود دارد؟",
			),
			yn(
				"drowsyDriving",
				"Have you ever felt unsafe while driving because of sleepiness?",
				"هل شعرت يوماً بعدم الأمان أثناء القيادة بسبب النعاس؟",
				"آیا تاکنون به‌خاطر خواب‌آلودگی هنگام رانندگی احساس ناامنی کرده‌اید؟",
			),
		],
	},
	{
		title: {
			en: "Previous Sleep Evaluation",
			ar: "تقييم النوم السابق",
			fa: "ارزیابی‌های قبلی خواب",
		},
		fields: [
			yn(
				"hadStudy",
				"Have you ever undergone a sleep study?",
				"هل خضعت سابقاً لدراسة نوم؟",
				"آیا تاکنون تست خواب انجام داده‌اید؟",
			),
			yn(
				"diagnosed",
				"Have you ever been diagnosed with sleep apnea?",
				"هل شُخّصت سابقاً بانقطاع النفس أثناء النوم؟",
				"آیا تاکنون آپنه خواب برای شما تشخیص داده شده است؟",
			),
			yn(
				"usedPap",
				"Have you ever used CPAP or BiPAP therapy?",
				"هل استخدمت سابقاً علاج CPAP أو BiPAP؟",
				"آیا تاکنون از درمان CPAP یا BiPAP استفاده کرده‌اید؟",
			),
			yn(
				"papDifficulty",
				"If yes, did you experience difficulty using the device?",
				"إذا كانت الإجابة نعم، هل واجهت صعوبة في استخدام الجهاز؟",
				"اگر بله، آیا در استفاده از دستگاه مشکل داشتید؟",
			),
		],
	},
];

const ESS_SCALE: Record<Locale, string[]> = {
	en: ["Would never doze", "Slight chance", "Moderate chance", "High chance"],
	ar: ["لن أغفو أبداً", "احتمال ضئيل", "احتمال متوسط", "احتمال كبير"],
	fa: ["هرگز چرت نمی‌زنم", "احتمال کم", "احتمال متوسط", "احتمال زیاد"],
};

const UI = {
	en: {
		step: "Step",
		of: "of",
		next: "Next step",
		back: "Back",
		finish: "See my result",
		required: "Please answer all questions in this step.",
		optional: "Answer only if you have used CPAP/BiPAP.",
		resultTitle: "Your Result",
		score: "Score",
		ess: "Epworth score",
		bmi: "BMI",
		levels: { low: "Low Risk", moderate: "Moderate Risk", high: "High Risk" },
		messages: {
			low: "Your responses suggest a lower risk of sleep-related breathing disorders.",
			moderate:
				"Your responses suggest a moderate risk of sleep-related breathing disorders.",
			high: "Your responses suggest a higher risk of sleep-related breathing disorders.",
		},
		advice: {
			low: "Keep healthy sleep habits. If symptoms appear or change, retake the assessment or talk to your doctor.",
			moderate:
				"Consider discussing these results with your physician. A home sleep test can give a clear answer.",
			high: "We recommend speaking with a physician and arranging a sleep study. Our team can help you get started.",
		},
		special:
			"Loud frequent snoring, observed breathing pauses and daytime sleepiness together indicate high risk.",
		bookTest: "Home Sleep Test",
		whatsapp: "Send result via WhatsApp",
		print: "Print",
		retake: "Retake",
		disclaimer:
			"This assessment is for educational purposes only and does not replace a medical diagnosis. Please consult a qualified healthcare professional.",
		saved: "Your answers are saved on this device until you finish.",
		time: "About 3 minutes",
	},
	ar: {
		step: "الخطوة",
		of: "من",
		next: "الخطوة التالية",
		back: "رجوع",
		finish: "اعرض نتيجتي",
		required: "يرجى الإجابة عن جميع أسئلة هذه الخطوة.",
		optional: "أجب فقط إذا كنت قد استخدمت CPAP/BiPAP.",
		resultTitle: "نتيجتك",
		score: "النقاط",
		ess: "مقياس إبوورث",
		bmi: "مؤشر كتلة الجسم",
		levels: { low: "خطر منخفض", moderate: "خطر متوسط", high: "خطر مرتفع" },
		messages: {
			low: "تشير إجاباتك إلى خطر منخفض للإصابة باضطرابات التنفس المرتبطة بالنوم.",
			moderate:
				"تشير إجاباتك إلى خطر متوسط للإصابة باضطرابات التنفس المرتبطة بالنوم.",
			high: "تشير إجاباتك إلى خطر مرتفع للإصابة باضطرابات التنفس المرتبطة بالنوم.",
		},
		advice: {
			low: "حافظ على عادات نوم صحية. إذا ظهرت أعراض أو تغيرت، أعد التقييم أو تحدث مع طبيبك.",
			moderate:
				"ننصح بمناقشة هذه النتائج مع طبيبك، ويمكن لدراسة النوم المنزلية أن تعطي إجابة واضحة.",
			high: "ننصح بالتحدث مع طبيب وإجراء دراسة نوم، ويمكن لفريقنا مساعدتك على البدء.",
		},
		special:
			"الشخير المتكرر بصوت عالٍ مع توقف التنفس الملحوظ والنعاس النهاري معاً تشير إلى خطر مرتفع.",
		bookTest: "دراسة النوم المنزلية",
		whatsapp: "أرسل النتيجة عبر واتساب",
		print: "طباعة",
		retake: "إعادة التقييم",
		disclaimer:
			"هذا التقييم لأغراض تثقيفية فقط ولا يغني عن التشخيص الطبي. يرجى استشارة مختص رعاية صحية مؤهل.",
		saved: "تُحفظ إجاباتك على هذا الجهاز حتى تنتهي.",
		time: "حوالي 3 دقائق",
	},
	fa: {
		step: "مرحله",
		of: "از",
		next: "مرحله بعد",
		back: "بازگشت",
		finish: "مشاهده نتیجه",
		required: "لطفاً به همه سؤالات این مرحله پاسخ دهید.",
		optional: "فقط در صورت استفاده از CPAP/BiPAP پاسخ دهید.",
		resultTitle: "نتیجه شما",
		score: "امتیاز",
		ess: "امتیاز اپورث",
		bmi: "شاخص توده بدنی",
		levels: { low: "ریسک پایین", moderate: "ریسک متوسط", high: "ریسک بالا" },
		messages: {
			low: "پاسخ‌های شما نشان‌دهنده ریسک پایین اختلالات تنفسی مرتبط با خواب است.",
			moderate:
				"پاسخ‌های شما نشان‌دهنده ریسک متوسط اختلالات تنفسی مرتبط با خواب است.",
			high: "پاسخ‌های شما نشان‌دهنده ریسک بالای اختلالات تنفسی مرتبط با خواب است.",
		},
		advice: {
			low: "عادت‌های خواب سالم را حفظ کنید. اگر علائمی ظاهر یا تغییر کرد، دوباره ارزیابی کنید یا با پزشک صحبت کنید.",
			moderate:
				"پیشنهاد می‌کنیم این نتایج را با پزشک خود در میان بگذارید. تست خواب در منزل می‌تواند پاسخ روشنی بدهد.",
			high: "توصیه می‌کنیم با پزشک مشورت کرده و تست خواب انجام دهید. تیم ما می‌تواند در شروع به شما کمک کند.",
		},
		special:
			"خروپف بلند و مکرر، قطع تنفس مشاهده‌شده و خواب‌آلودگی روزانه با هم نشان‌دهنده ریسک بالا هستند.",
		bookTest: "تست خواب در منزل",
		whatsapp: "ارسال نتیجه در واتساپ",
		print: "چاپ",
		retake: "ارزیابی دوباره",
		disclaimer:
			"این ارزیابی صرفاً جنبه آموزشی دارد و جایگزین تشخیص پزشکی نیست. لطفاً با متخصص مراقبت‌های بهداشتی مشورت کنید.",
		saved: "پاسخ‌های شما تا پایان روی همین دستگاه ذخیره می‌شود.",
		time: "حدود ۳ دقیقه",
	},
};

const LEVEL_COLOR: Record<RiskLevel, string> = {
	low: "#16a34a",
	moderate: "#f59e0b",
	high: "#e5484d",
};
const STORAGE = "tadawi-sleep-assessment";

function Gauge({ level, total }: { level: RiskLevel; total: number }) {
	const target =
		level === "high"
			? Math.max(0.78, Math.min(total / 40, 1))
			: level === "moderate"
				? 0.5 + ((total - 13) / 12) * 0.25
				: Math.min(total / 12, 1) * 0.3;
	const [v, setV] = useState(0);
	useEffect(() => {
		const id = requestAnimationFrame(() => setV(target));
		return () => cancelAnimationFrame(id);
	}, [target]);
	const r = 80;
	const c = Math.PI * r;
	return (
		<svg
			viewBox="0 0 200 120"
			className="w-full max-w-[17rem]"
			aria-hidden="true"
		>
			<defs>
				<linearGradient id="gauge-grad" x1="0" x2="1">
					<stop offset="0%" stopColor="#16a34a" />
					<stop offset="50%" stopColor="#f59e0b" />
					<stop offset="100%" stopColor="#e5484d" />
				</linearGradient>
			</defs>
			<path
				d="M20 100 A80 80 0 0 1 180 100"
				fill="none"
				stroke="currentColor"
				strokeOpacity="0.1"
				strokeWidth="16"
				strokeLinecap="round"
			/>
			<path
				d="M20 100 A80 80 0 0 1 180 100"
				fill="none"
				stroke="url(#gauge-grad)"
				strokeWidth="16"
				strokeLinecap="round"
				strokeDasharray={c}
				strokeDashoffset={c * (1 - v)}
				style={{
					transition: "stroke-dashoffset 1.6s cubic-bezier(0.23,1,0.32,1)",
				}}
			/>
			<g
				style={{
					transform: `rotate(${-90 + v * 180}deg)`,
					transformOrigin: "100px 100px",
					transition: "transform 1.6s cubic-bezier(0.23,1,0.32,1)",
				}}
			>
				<line
					x1="100"
					y1="100"
					x2="100"
					y2="34"
					stroke="currentColor"
					strokeWidth="4"
					strokeLinecap="round"
				/>
				<circle cx="100" cy="100" r="8" fill="currentColor" />
			</g>
		</svg>
	);
}

export default function SleepAssessment({
	locale = "en",
}: {
	locale?: Locale;
}) {
	const ui = UI[locale] ?? UI.en;
	const [step, setStep] = useState(0);
	const [answers, setAnswers] = useState<Answers>({});
	const [error, setError] = useState(false);
	const [done, setDone] = useState(false);
	const topRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		try {
			const saved = JSON.parse(sessionStorage.getItem(STORAGE) || "null");
			if (saved?.answers) {
				setAnswers(saved.answers);
				setStep(Math.min(saved.step ?? 0, STEPS.length - 1));
			}
		} catch {
			/* storage unavailable */
		}
	}, []);

	useEffect(() => {
		try {
			sessionStorage.setItem(STORAGE, JSON.stringify({ step, answers }));
		} catch {
			/* storage unavailable */
		}
	}, [step, answers]);

	const result = useMemo(() => scoreAssessment(answers), [answers]);
	const current = STEPS[step];
	const set = (id: string, value: string | number) => {
		setAnswers((a) => ({ ...a, [id]: value }));
		setError(false);
	};

	const isOptional = (f: Field) =>
		f.id === "papDifficulty" && answers.usedPap !== "yes";
	const stepValid = current.fields.every((f) => {
		if (isOptional(f)) return true;
		const v = answers[f.id];
		if (f.kind === "number")
			return (
				v !== undefined && v !== "" && Number(v) >= f.min && Number(v) <= f.max
			);
		return v !== undefined && v !== "";
	});

	const go = (to: number) => {
		setStep(to);
		setError(false);
		topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
	};
	const next = () => {
		if (!stepValid) {
			setError(true);
			return;
		}
		if (step === STEPS.length - 1) {
			setDone(true);
			topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
		} else go(step + 1);
	};
	const restart = () => {
		setAnswers({});
		setDone(false);
		go(0);
	};

	if (done) {
		const color = LEVEL_COLOR[result.level];
		const summary = [
			`*${ui.resultTitle}: ${ui.levels[result.level]}*`,
			`${ui.score}: ${result.total}`,
			`${ui.ess}: ${result.ess}/24`,
			result.bmi ? `${ui.bmi}: ${result.bmi.toFixed(1)}` : "",
			ui.messages[result.level],
		]
			.filter(Boolean)
			.join("\n");
		return (
			<div ref={topRef} className="scroll-mt-28">
				<div className="card-base overflow-hidden">
					<div
						className="p-6 md:p-10 grid md:grid-cols-[auto_1fr] gap-8 items-center"
						style={{
							background: `radial-gradient(80% 120% at 0% 0%, ${color}22, transparent 60%)`,
						}}
					>
						<div
							className="flex flex-col items-center text-90"
							style={{ color }}
						>
							<Gauge level={result.level} total={result.total} />
							<div className="-mt-4 text-4xl font-black" dir="ltr">
								{result.total}
							</div>
							<div className="text-xs font-bold uppercase tracking-wider text-50">
								{ui.score}
							</div>
						</div>
						<div>
							<p className="section-eyebrow">{ui.resultTitle}</p>
							<h2
								className="text-3xl md:text-4xl font-black mt-2"
								style={{ color }}
							>
								{ui.levels[result.level]}
							</h2>
							<p className="text-lg text-90 font-semibold mt-3 leading-relaxed">
								{ui.messages[result.level]}
							</p>
							<p className="text-75 mt-3 leading-relaxed">
								{ui.advice[result.level]}
							</p>
							{result.specialRule && (
								<p
									className="mt-3 text-sm font-semibold rounded-xl px-4 py-3"
									style={{ background: `${color}18`, color }}
								>
									{ui.special}
								</p>
							)}
							<div className="grid grid-cols-2 gap-3 mt-5 max-w-sm">
								<div className="rounded-xl p-3 bg-[var(--btn-regular-bg)]">
									<div className="text-xs text-50 font-bold">{ui.ess}</div>
									<div className="text-xl font-extrabold text-90" dir="ltr">
										{result.ess} / 24
									</div>
								</div>
								<div className="rounded-xl p-3 bg-[var(--btn-regular-bg)]">
									<div className="text-xs text-50 font-bold">{ui.bmi}</div>
									<div className="text-xl font-extrabold text-90" dir="ltr">
										{result.bmi ? result.bmi.toFixed(1) : "–"}
									</div>
								</div>
							</div>
						</div>
					</div>
					<div className="flex flex-wrap gap-2 px-6 md:px-10 py-5 border-t border-black/5 dark:border-white/10 no-print">
						<a
							className="btn-grad"
							href={`/${locale}/products/at-home-sleep-study/`}
						>
							<MdCheck /> {ui.bookTest}
						</a>
						<a
							className="btn-whatsapp"
							target="_blank"
							rel="noopener noreferrer"
							href={`https://api.whatsapp.com/send?phone=${WHATSAPP_PHONE_RAW}&text=${encodeURIComponent(summary)}`}
						>
							<FaWhatsapp /> {ui.whatsapp}
						</a>
						<button
							type="button"
							className="btn-soft"
							onClick={() => window.print()}
						>
							<MdPrint /> {ui.print}
						</button>
						<button type="button" className="btn-soft" onClick={restart}>
							<MdRefresh /> {ui.retake}
						</button>
					</div>
				</div>
				<p className="text-xs text-50 mt-4 leading-relaxed px-1">
					{ui.disclaimer}
				</p>
			</div>
		);
	}

	const progress = ((step + (stepValid ? 1 : 0.5)) / STEPS.length) * 100;

	return (
		<div ref={topRef} className="scroll-mt-28">
			{/* Progress */}
			<div className="card-base p-5 md:p-6 mb-4">
				<div className="flex items-center justify-between gap-3 mb-4">
					<div className="text-sm font-bold text-50">
						{ui.step} <span className="text-[var(--primary)]">{step + 1}</span>{" "}
						{ui.of} {STEPS.length}
					</div>
					<div className="text-xs text-50">{ui.time}</div>
				</div>
				<div className="flex items-center gap-1.5 md:gap-2">
					{STEPS.map((s, i) => (
						<button
							key={i}
							type="button"
							disabled={i > step}
							onClick={() => i < step && go(i)}
							className="step-dot"
							title={s.title[locale]}
							style={{
								background:
									i < step
										? "var(--primary)"
										: i === step
											? "color-mix(in oklch, var(--primary) 18%, transparent)"
											: "var(--btn-regular-bg)",
								color:
									i < step
										? "white"
										: i === step
											? "var(--primary)"
											: "var(--btn-content)",
								transform: i === step ? "scale(1.12)" : undefined,
							}}
						>
							{i < step ? <MdCheck /> : i + 1}
						</button>
					))}
					<div className="flex-1 h-1.5 rounded-full bg-[var(--btn-regular-bg)] overflow-hidden ms-2">
						<div
							className="h-full rounded-full bg-[var(--primary)] transition-all duration-700"
							style={{ width: `${progress}%` }}
						/>
					</div>
				</div>
			</div>

			{/* Current step only — the next step opens after this one is complete */}
			<div key={step} className="card-base p-6 md:p-9 assessment-step">
				<h2 className="text-2xl font-extrabold text-90">
					{current.title[locale]}
				</h2>
				{current.intro && (
					<p className="text-75 mt-2">{current.intro[locale]}</p>
				)}
				{step === 2 && (
					<div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4 text-xs font-semibold text-50">
						{ESS_SCALE[locale].map((s, i) => (
							<div
								key={i}
								className="rounded-lg px-2.5 py-1.5 bg-[var(--btn-regular-bg)]"
							>
								<b className="text-[var(--primary)]">{i}</b> = {s}
							</div>
						))}
					</div>
				)}

				<div className="flex flex-col gap-6 mt-6">
					{current.fields.map((f, fi) => {
						const invalid =
							error &&
							!isOptional(f) &&
							(answers[f.id] === undefined || answers[f.id] === "");
						return (
							<fieldset
								key={f.id}
								className="flex flex-col gap-2.5"
								style={{ opacity: isOptional(f) ? 0.55 : 1 }}
							>
								<legend className="field-label !mb-2.5 !text-[0.95rem]">
									<span className="text-[var(--primary)] me-1.5">
										{fi + 1}.
									</span>
									{f.label[locale]}
									{f.kind === "number" && f.unit && (
										<span className="text-50 font-semibold"> ({f.unit})</span>
									)}
								</legend>
								{isOptional(f) && (
									<p className="text-xs text-50 -mt-1">{ui.optional}</p>
								)}
								{f.kind === "number" && (
									<input
										type="number"
										inputMode="decimal"
										min={f.min}
										max={f.max}
										value={answers[f.id] ?? ""}
										onChange={(e) => set(f.id, e.target.value)}
										className="field-input max-w-[14rem]"
										aria-invalid={invalid}
										dir="ltr"
									/>
								)}
								{f.kind === "choice" && (
									<div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
										{f.options.map((o) => (
											<label key={o.key} className="choice">
												<input
													type="radio"
													name={f.id}
													value={o.key}
													checked={answers[f.id] === o.key}
													onChange={() => set(f.id, o.key)}
													disabled={isOptional(f)}
												/>
												<span className="choice-mark" />
												{o.label[locale]}
											</label>
										))}
									</div>
								)}
								{f.kind === "ess" && (
									<div className="grid grid-cols-4 gap-2">
										{[0, 1, 2, 3].map((n) => (
											<label
												key={n}
												className="choice !justify-center !px-2"
												title={ESS_SCALE[locale][n]}
											>
												<input
													type="radio"
													name={f.id}
													value={n}
													checked={String(answers[f.id]) === String(n)}
													onChange={() => set(f.id, n)}
												/>
												<span className="text-lg font-black">{n}</span>
											</label>
										))}
									</div>
								)}
							</fieldset>
						);
					})}
				</div>

				{error && (
					<p className="field-error mt-5 !text-sm font-semibold">
						{ui.required}
					</p>
				)}

				<div className="flex items-center justify-between gap-3 mt-8">
					{step > 0 ? (
						<button
							type="button"
							className="btn-soft"
							onClick={() => go(step - 1)}
						>
							<MdArrowBack className="rtl:rotate-180" /> {ui.back}
						</button>
					) : (
						<span className="text-xs text-50">{ui.saved}</span>
					)}
					<button type="button" className="btn-grad" onClick={next}>
						{step === STEPS.length - 1 ? ui.finish : ui.next}{" "}
						<MdArrowForward className="rtl:rotate-180" />
					</button>
				</div>
			</div>
			<p className="text-xs text-50 mt-4 leading-relaxed px-1">
				{ui.disclaimer}
			</p>
		</div>
	);
}
