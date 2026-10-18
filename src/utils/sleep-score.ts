/**
 * Online Sleep Assessment scoring (Website.md item 20).
 *
 * Step 1: Age > 50, male, BMI > 35, neck > 40 cm → +1 each
 * Step 2: symptom answers with fixed points
 * Step 3: Epworth (8 items, 0–3) converted to OSA points + two yes/no items
 * Step 4: medical conditions, Step 5: lifestyle, Step 6: information only
 * Special rule: loud snoring "frequently" + observed apnea "yes" + (ESS ≥ 11 or fatigue = yes) → High
 * Result: 0–12 Low, 13–24 Moderate, ≥ 25 High
 */

export type Answers = Record<string, string | number | undefined>;

export const POINTS: Record<string, Record<string, number>> = {
	snore: { no: 0, sometimes: 2, frequently: 4 },
	observedApnea: { no: 0, notSure: 2, yes: 6 },
	choking: { no: 0, occasionally: 2, frequently: 4 },
	dryMouth: { no: 0, yes: 1 },
	headaches: { no: 0, yes: 1 },
	unrefreshing: { no: 0, yes: 3 },
	disturbsPartner: { no: 0, yes: 2 },
	awakenings: { none: 0, oneTwo: 1, threePlus: 2 },
	fatigue: { no: 0, yes: 2 },
	fellAsleep: { no: 0, yes: 3 },
	hypertension: { no: 0, yes: 2 },
	diabetes: { no: 0, yes: 1 },
	heartDisease: { no: 0, yes: 2 },
	arrhythmia: { no: 0, yes: 1 },
	heartAttackStroke: { no: 0, yes: 2 },
	heartFailureLung: { no: 0, yes: 2 },
	asthma: { no: 0, yes: 1 },
	nasalBlockage: { no: 0, yes: 1 },
	reflux: { no: 0, yes: 1 },
	hypothyroidism: { no: 0, yes: 1 },
	weightGain: { no: 0, yes: 1 },
	smoking: { no: 0, yes: 1 },
	shiftWork: { no: 0, yes: 1 },
	familyHistory: { no: 0, yes: 2 },
	drowsyDriving: { no: 0, yes: 3 },
};

export const EPWORTH_KEYS = [
	"ess1",
	"ess2",
	"ess3",
	"ess4",
	"ess5",
	"ess6",
	"ess7",
	"ess8",
] as const;

export function essToPoints(ess: number): number {
	if (ess >= 16) return 6;
	if (ess >= 11) return 4;
	if (ess >= 8) return 2;
	return 0;
}

export function bmi(heightCm: number, weightKg: number): number {
	if (!heightCm || !weightKg) return 0;
	const m = heightCm / 100;
	return weightKg / (m * m);
}

export type RiskLevel = "low" | "moderate" | "high";

export function scoreAssessment(a: Answers) {
	const num = (k: string) => Number(a[k]) || 0;
	const pts = (k: string) => POINTS[k]?.[String(a[k])] ?? 0;

	const bmiValue = bmi(num("height"), num("weight"));
	const step1 =
		(num("age") > 50 ? 1 : 0) +
		(a.gender === "male" ? 1 : 0) +
		(bmiValue > 35 ? 1 : 0) +
		(num("neck") > 40 ? 1 : 0);
	const step2 = [
		"snore",
		"observedApnea",
		"choking",
		"dryMouth",
		"headaches",
		"unrefreshing",
		"disturbsPartner",
		"awakenings",
	]
		.map(pts)
		.reduce((s, v) => s + v, 0);
	const ess = EPWORTH_KEYS.map(num).reduce(
		(s, v) => s + Math.min(Math.max(v, 0), 3),
		0,
	);
	const essPoints = essToPoints(ess);
	const step3 = essPoints + pts("fatigue") + pts("fellAsleep");
	const step4 = [
		"hypertension",
		"diabetes",
		"heartDisease",
		"arrhythmia",
		"heartAttackStroke",
		"heartFailureLung",
		"asthma",
		"nasalBlockage",
		"reflux",
		"hypothyroidism",
	]
		.map(pts)
		.reduce((s, v) => s + v, 0);
	const step5 = [
		"weightGain",
		"smoking",
		"shiftWork",
		"familyHistory",
		"drowsyDriving",
	]
		.map(pts)
		.reduce((s, v) => s + v, 0);

	const total = step1 + step2 + step3 + step4 + step5;
	const specialRule =
		a.snore === "frequently" &&
		a.observedApnea === "yes" &&
		(ess >= 11 || a.fatigue === "yes");

	let level: RiskLevel =
		total >= 25 ? "high" : total >= 13 ? "moderate" : "low";
	if (specialRule) level = "high";

	return {
		total,
		ess,
		essPoints,
		bmi: bmiValue,
		level,
		specialRule,
		breakdown: { step1, step2, step3, step4, step5 },
	};
}
