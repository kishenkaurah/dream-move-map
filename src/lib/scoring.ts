/**
 * TRANSPARENT RULES-BASED SCORING ENGINE
 * --------------------------------------
 * Every destination is scored 0-100 on eight factors. Each factor score is a
 * simple, inspectable rule based on the user's answers and the data in
 * src/data/destinations.ts.
 *
 * Overall match = weighted average of factor scores, where weights start at
 * BASE_WEIGHTS and are nudged by the user's stated priorities (e.g. answering
 * "healthcare is critical" raises the healthcare weight).
 *
 * CONSTRAINTS: severe affordability or visa-income mismatches are not treated
 * as small deductions. They apply a hard cap to the overall score and surface
 * an explicit warning on the results page.
 */
import {
  BASE_WEIGHTS,
  DESTINATIONS,
  type Destination,
  type FactorKey,
  type HomeRegion,
} from "@/data/destinations";
import type { Answers } from "@/data/questions";

const INCOME_MIDPOINT: Record<string, number> = {
  under_1500: 1200,
  "1500_2500": 2000,
  "2500_4000": 3200,
  "4000_6000": 5000,
  over_6000: 7500,
};

const SAVINGS_MIDPOINT: Record<string, number> = {
  under_50k: 30000,
  "50_150k": 100000,
  "150_500k": 300000,
  over_500k: 750000,
};

/** Typical current monthly household spend at home, in USD. */
const SPEND_MIDPOINT: Record<string, number> = {
  under_2000: 1700,
  "2000_3000": 2500,
  "3000_4500": 3700,
  "4500_6500": 5500,
  over_6500: 7500,
};

/** Cost level of the user's current home region, on the same 100 = US baseline. */
const HOME_COST_INDEX: Record<string, number> = {
  us_canada: 100,
  uk: 92,
  eu: 85,
  australia_nz: 96,
  other: 70,
};

/** How the user wants their lifestyle to change once abroad. */
const SPEND_STYLE_FACTOR: Record<string, number> = {
  trim: 0.85,
  same: 1,
  upgrade: 1.2,
};

/**
 * Projects what the user would likely spend in a destination, based on what
 * they spend at home today, adjusted for local price levels and the lifestyle
 * they say they want. Returns null when they didn't give a usable figure.
 */
export function projectSpend(d: Destination, answers: Answers): number | null {
  const spend = SPEND_MIDPOINT[str(answers, "current_spend")];
  if (!spend) return null;
  const homeIndex = HOME_COST_INDEX[str(answers, "home_region")] ?? 100;
  const style = SPEND_STYLE_FACTOR[str(answers, "spend_style")] ?? 1;
  return Math.round(((spend * (d.costIndex / homeIndex) * style) / 50) * 50);
}

const AGE_MIN: Record<string, number> = {
  under_55: 50,
  "55_59": 55,
  "60_64": 60,
  "65_69": 65,
  "70_plus": 70,
};

export interface FactorResult {
  key: FactorKey;
  label: string;
  score: number;
  weight: number;
  note: string;
}

export interface DestinationResult {
  destination: Destination;
  overall: number;
  factors: FactorResult[];
  budgetRange: [number, number];
  /** Projected monthly spend based on the user's current home spending, if given */
  projectedSpend: number | null;
  constraints: string[];
  strengths: string[];
  headline: string;
}

const clamp = (n: number, min = 0, max = 100) => Math.max(min, Math.min(max, n));

function str(answers: Answers, key: string): string {
  const v = answers[key];
  return typeof v === "string" ? v : "";
}

function list(answers: Answers, key: string): string[] {
  const v = answers[key];
  return Array.isArray(v) ? v : [];
}

/** Weights start from BASE_WEIGHTS and shift with what the user says matters. */
export function computeWeights(answers: Answers): Record<FactorKey, number> {
  const w: Record<FactorKey, number> = { ...BASE_WEIGHTS };
  const priorities = list(answers, "priorities");

  const healthImportance = str(answers, "healthcare_importance");
  if (healthImportance === "high") w.healthcare += 6;
  if (healthImportance === "critical") w.healthcare += 12;
  if (healthImportance === "low") w.healthcare -= 5;

  const english = str(answers, "english");
  if (english === "essential") w.language += 8;
  if (english === "willing") w.language -= 3;

  const family = str(answers, "family_proximity");
  if (family === "very") w.proximity += 9;
  if (family === "not") w.proximity -= 4;

  const bureaucracy = str(answers, "bureaucracy");
  if (bureaucracy === "low") w.bureaucracy += 7;
  if (bureaucracy === "high") w.bureaucracy -= 3;

  if (str(answers, "tax") === "high") w.affordability += 4;
  if (priorities.includes("cost")) w.affordability += 6;
  if (priorities.includes("healthcare")) w.healthcare += 4;
  if (priorities.includes("easy_residency")) w.visa += 6;
  if (priorities.includes("travel_access")) w.proximity += 3;
  if (priorities.includes("nature") || priorities.includes("food_culture")) w.lifestyle += 4;

  (Object.keys(w) as FactorKey[]).forEach((k) => {
    w[k] = Math.max(2, w[k]);
  });
  return w;
}

function scoreAffordability(d: Destination, answers: Answers) {
  const couple = str(answers, "household") === "couple";
  const income = INCOME_MIDPOINT[str(answers, "income")] ?? 2000;
  const savings = SAVINGS_MIDPOINT[str(answers, "savings")] ?? 0;
  const [low, high] = couple ? d.budget.couple : d.budget.solo;
  const typicalMid = (low + high) / 2;
  const projected = projectSpend(d, answers);
  // Their own spending habits carry most of the weight when we know them.
  const mid = projected ? projected * 0.6 + typicalMid * 0.4 : typicalMid;
  // Savings provide a modest monthly cushion in the model (2% annual draw).
  const effective = income + (savings * 0.02) / 12;
  const ratio = effective / mid;

  let score: number;
  if (ratio >= 1.6) score = 100;
  else if (ratio >= 1.0) score = 75 + ((ratio - 1) / 0.6) * 25;
  else if (ratio >= 0.8) score = 50 + ((ratio - 0.8) / 0.2) * 25;
  else if (ratio >= 0.6) score = 20 + ((ratio - 0.6) / 0.2) * 30;
  else score = clamp(ratio * 33);

  const projectedNote = projected
    ? ` Based on what you spend at home today, we'd expect you to spend around $${projected.toLocaleString()}/month here.`
    : "";
  const note =
    ratio >= 1.2
      ? `Your income comfortably covers a typical ${couple ? "couple's" : "solo"} budget of $${low.toLocaleString()}–$${high.toLocaleString()}/month.`
      : ratio >= 0.95
        ? `Your income roughly matches the typical budget of $${low.toLocaleString()}–$${high.toLocaleString()}/month, with little slack.`
        : `Typical costs of $${low.toLocaleString()}–$${high.toLocaleString()}/month run ahead of your expected income.`;

  const floor = couple ? d.affordabilityFloor.couple : d.affordabilityFloor.solo;
  const constrained = effective < floor;
  return {
    score: clamp(score),
    note: note + projectedNote,
    constrained,
    floor,
    low,
    high,
    effective,
    projected,
  };
}

function scoreVisa(d: Destination, answers: Answers) {
  const income = INCOME_MIDPOINT[str(answers, "income")] ?? 2000;
  const savings = SAVINGS_MIDPOINT[str(answers, "savings")] ?? 0;
  const age = AGE_MIN[str(answers, "age")] ?? 60;

  // Base score from route complexity (1 simplest → 5 hardest)
  let score = 100 - (d.visa.complexity - 1) * 13;

  const incomeGap = income / d.visa.incomeGuide;
  if (incomeGap < 1) {
    score -= (1 - incomeGap) * 70;
    // Strong savings can partially substitute for income on several routes
    if (savings >= 150000) score += 12;
  } else if (incomeGap > 1.4) {
    score += 8;
  }

  let ageIssue = false;
  if (d.visa.minAge && age < d.visa.minAge) {
    score -= 25;
    ageIssue = true;
  }

  const tolerance = str(answers, "bureaucracy");
  if (tolerance === "low" && d.visa.complexity >= 4) score -= 8;
  if (tolerance === "high") score += 5;

  const notes: string[] = [];
  notes.push(d.visa.label + ".");
  if (incomeGap < 1)
    notes.push(
      `Commonly referenced income guidance is around $${d.visa.incomeGuide.toLocaleString()}/month, above your expected income.`,
    );
  if (ageIssue) notes.push(`The main retirement route typically requires age ${d.visa.minAge}+.`);

  const constrained = incomeGap < 0.7 && savings < 150000;
  return { score: clamp(score), note: notes.join(" "), constrained };
}

function scoreHealthcare(d: Destination, answers: Answers) {
  const importance = str(answers, "healthcare_importance");
  let score = (d.healthcare.rating / 5) * 100;
  if (importance === "critical" && d.healthcare.rating < 5) score -= 10;
  if (importance === "low") score = 60 + score * 0.4;
  return {
    score: clamp(score),
    note: d.healthcare.label + ".",
    constrained: importance === "critical" && d.healthcare.rating <= 2,
  };
}

function scoreLifestyle(d: Destination, answers: Answers) {
  const setting = str(answers, "setting");
  const pace = str(answers, "pace");
  const housing = str(answers, "housing");
  const priorities = list(answers, "priorities");

  const settingScore = d.settingFit[setting] ?? 60;
  const paceScore = d.paceFit[pace] ?? 60;
  const housingScore = d.housingFit[housing] ?? 70;
  const priorityScore = priorities.length
    ? priorities.reduce((sum, p) => sum + (d.priorityStrength[p] ?? 60), 0) / priorities.length
    : 70;

  const score = settingScore * 0.3 + paceScore * 0.25 + housingScore * 0.15 + priorityScore * 0.3;
  return {
    score: clamp(score),
    note: `Matches your preference for ${setting.replace("_", " ")} living at a ${pace} pace, and lines up with the priorities you selected.`,
    constrained: false,
  };
}

function scoreClimate(d: Destination, answers: Answers) {
  const climate = str(answers, "climate");
  const score = d.climateFit[climate] ?? 50;
  return {
    score: clamp(score),
    note:
      score >= 80
        ? "Its typical weather closely matches the climate you asked for."
        : score >= 50
          ? "Climate is a partial match — expect some adjustment."
          : "The climate here is quite different from your stated preference.",
    constrained: false,
  };
}

function scoreLanguage(d: Destination, answers: Answers) {
  const need = str(answers, "english");
  const base = (d.english / 5) * 100;
  let score = base;
  if (need === "essential") score = clamp(base - (5 - d.english) * 12);
  if (need === "willing") score = clamp(60 + base * 0.4 + d.culturalEase * 4);
  else score = clamp(score * 0.8 + d.culturalEase * 4);
  return {
    score,
    note: `English usability rated ${d.english}/5 for daily life; cultural adjustment rated ${d.culturalEase}/5 for ease.`,
    constrained: need === "essential" && d.english <= 2,
  };
}

function scoreProximity(d: Destination, answers: Answers) {
  const region = (str(answers, "home_region") || "other") as HomeRegion;
  const hours = d.travelHours[region] ?? 12;
  const importance = str(answers, "family_proximity");
  const raw = clamp(100 - Math.max(0, hours - 3) * 4.5);
  const score = importance === "not" ? clamp(70 + raw * 0.3) : raw;
  return {
    score,
    note: `Roughly ${hours} hours of travel from your current region.`,
    constrained: false,
  };
}

function scoreBureaucracy(d: Destination, answers: Answers) {
  const tolerance = str(answers, "bureaucracy");
  const taxSensitivity = str(answers, "tax");
  const admin = 100 - (d.bureaucracy - 1) * 18;
  const tolerated = tolerance === "high" ? 25 : tolerance === "medium" ? 12 : 0;
  let score = clamp(admin + tolerated);
  if (taxSensitivity === "high") score = clamp(score * 0.6 + (d.taxFriendliness / 5) * 100 * 0.4);
  else if (taxSensitivity === "medium")
    score = clamp(score * 0.8 + (d.taxFriendliness / 5) * 100 * 0.2);
  return {
    score,
    note: `Administrative load rated ${d.bureaucracy}/5 and tax friendliness for foreign retirees rated ${d.taxFriendliness}/5.`,
    constrained: false,
  };
}

export function scoreDestination(d: Destination, answers: Answers): DestinationResult {
  const weights = computeWeights(answers);
  const couple = str(answers, "household") === "couple";

  const aff = scoreAffordability(d, answers);
  const visa = scoreVisa(d, answers);
  const health = scoreHealthcare(d, answers);
  const life = scoreLifestyle(d, answers);
  const clim = scoreClimate(d, answers);
  const lang = scoreLanguage(d, answers);
  const prox = scoreProximity(d, answers);
  const bur = scoreBureaucracy(d, answers);

  const raw: Record<FactorKey, { score: number; note: string }> = {
    affordability: aff,
    visa,
    healthcare: health,
    lifestyle: life,
    climate: clim,
    language: lang,
    proximity: prox,
    bureaucracy: bur,
  };

  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
  let overall =
    (Object.keys(raw) as FactorKey[]).reduce((sum, k) => sum + raw[k].score * weights[k], 0) /
    totalWeight;

  const constraints: string[] = [];
  if (aff.constrained) {
    constraints.push(
      `Your expected income sits below the realistic floor of about $${aff.floor.toLocaleString()}/month for a ${couple ? "couple" : "single person"} here. This is a blocking issue, not a small gap.`,
    );
    overall = Math.min(overall, 45);
  }
  if (visa.constrained) {
    constraints.push(
      `Income evidence for the main residency route is typically around $${d.visa.incomeGuide.toLocaleString()}/month, well above your expected income. Alternative routes would need investigating.`,
    );
    overall = Math.min(overall, 55);
  }
  if (health.constrained) {
    constraints.push(
      "You flagged critical healthcare needs and this destination's care rating is limited.",
    );
    overall = Math.min(overall, 55);
  }
  if (lang.constrained) {
    constraints.push(
      "You need to function in English day to day, which would be difficult here without local language study.",
    );
    overall = Math.min(overall, 60);
  }

  const factors: FactorResult[] = (Object.keys(raw) as FactorKey[]).map((k) => ({
    key: k,
    label: FACTOR_LABELS_LOCAL[k],
    score: Math.round(raw[k].score),
    weight: Math.round((weights[k] / totalWeight) * 100),
    note: raw[k].note,
  }));

  const strengths = [...factors]
    .sort((a, b) => b.score * b.weight - a.score * a.weight)
    .slice(0, 3)
    .map((f) => f.label);

  const headline = constraints.length
    ? `${d.name} matches parts of your profile, but there are blocking issues to resolve first.`
    : `${d.name} scores well on ${(strengths[0] ?? "overall fit").toLowerCase()} and ${(strengths[1] ?? "lifestyle").toLowerCase()} for the profile you described.`;

  return {
    destination: d,
    overall: Math.round(overall),
    factors,
    budgetRange: couple ? d.budget.couple : d.budget.solo,
    projectedSpend: aff.projected,
    constraints,
    strengths,
    headline,
  };
}

import { FACTOR_LABELS as FACTOR_LABELS_LOCAL } from "@/data/destinations";

export function rankDestinations(answers: Answers): DestinationResult[] {
  return DESTINATIONS.map((d) => scoreDestination(d, answers)).sort((a, b) => b.overall - a.overall);
}
