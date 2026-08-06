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
import { VISA_ROUTES, VISA_ROUTE_TYPE_LABEL } from "@/data/visa-routes";
import { currencyForCitizenship, formatMoney, type CurrencyCode } from "@/lib/currency";

/** Citizenship drives visa and residency pathway logic. */
export function citizenshipOf(answers: Answers): HomeRegion {
  const v = str(answers, "citizenship");
  return (v || "other") as HomeRegion;
}

/** Current residence drives distance, flight times and cost-of-living baseline. */
export function residenceOf(answers: Answers): HomeRegion {
  const v = str(answers, "residence");
  if (!v || v === "same") return citizenshipOf(answers);
  return v as HomeRegion;
}

export function displayCurrency(answers: Answers): CurrencyCode {
  return currencyForCitizenship(str(answers, "citizenship"));
}

/** Countries where an EU/EEA citizen has freedom of movement. */
const EU_COUNTRIES = new Set(["Portugal", "Spain", "Greece"]);


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




/** Household shape derived from the single "who is moving" answer. */
export interface Household {
  partner: boolean;
  children: boolean;
  /** Cost multiplier applied on top of the solo/couple budget bands */
  multiplier: number;
  label: string;
}

export function household(answers: Answers): Household {
  const v = str(answers, "household");
  const partner = v === "couple" || v === "couple_kids";
  const children = v === "solo_kids" || v === "couple_kids";
  return {
    partner,
    children,
    multiplier: children ? 1.3 : 1,
    label: children
      ? partner
        ? "family with children"
        : "single parent with children"
      : partner
        ? "couple"
        : "single person",
  };
}

/** Typical monthly household spend at home for a single person, in USD. */
const HOME_TYPICAL_SOLO_SPEND = 2600;

/** Where in the destination's typical range each lifestyle choice lands. */
const SPEND_STYLE_POSITION: Record<string, number> = {
  trim: 0.2,
  same: 0.5,
  upgrade: 0.82,
};

/**
 * Projects what the user would likely spend in a destination.
 *
 * The projection is anchored to the destination's own typical range for the
 * household type: "keep a similar lifestyle" lands mid-range, trimming lands
 * lower, upgrading lands higher, nudged by how their current spending at home
 * compares with what is typical for their home region. The result is always
 * clamped inside the destination's stated range and rounded to the nearest $50,
 * so it can never contradict the range shown alongside it.
 */
export function projectSpend(d: Destination, answers: Answers): number | null {
  const spend = SPEND_MIDPOINT[str(answers, "current_spend")];
  if (!spend) return null;

  const hh = household(answers);
  const base = hh.partner ? d.budget.couple : d.budget.solo;
  const low = base[0] * hh.multiplier;
  const high = base[1] * hh.multiplier;

  const homeIndex = HOME_COST_INDEX[residenceOf(answers)] ?? 100;
  const typicalHome =
    HOME_TYPICAL_SOLO_SPEND * (homeIndex / 100) * (hh.partner ? 1.35 : 1) * hh.multiplier;

  // How their spending at home compares with a typical household like theirs.
  const habitRatio = spend / typicalHome;
  const habitShift = clampNum((habitRatio - 1) * 0.35, -0.25, 0.25);

  const position = clampNum(
    (SPEND_STYLE_POSITION[str(answers, "spend_style")] ?? 0.5) + habitShift,
    0.05,
    0.95,
  );

  const projected = low + position * (high - low);
  return Math.round(clampNum(projected, low, high) / 50) * 50;
}

const clampNum = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));



/** Rough share of a monthly budget by category, used for the spend breakdown. */
const SPEND_SHARES: { label: string; share: number; hint: string }[] = [
  { label: "Rent / housing", share: 0.34, hint: "A comfortable long-term rental in a central area" },
  { label: "Groceries", share: 0.16, hint: "Supermarket and local market shopping" },
  { label: "Eating out & nightlife", share: 0.13, hint: "Restaurants, cafés and going out" },
  { label: "Utilities & internet", share: 0.07, hint: "Power, water, mobile and home broadband" },
  { label: "Transport", share: 0.07, hint: "Local transport, taxis or running a small car" },
  { label: "Healthcare & insurance", share: 0.11, hint: "Private cover plus routine appointments" },
  { label: "Travel & leisure", share: 0.08, hint: "Trips home, weekends away, hobbies" },
  { label: "Everything else", share: 0.04, hint: "Household help, admin, visa fees and buffer" },
];

const SCHOOLING = {
  label: "Schooling & childcare",
  share: 0.14,
  hint: "International or bilingual school fees and activities",
};

export interface SpendCategory {
  label: string;
  hint: string;
  amount: number;
  share: number;
}

/** Splits a monthly total into indicative categories. */
export function spendBreakdown(total: number, hh: Household): SpendCategory[] {
  const rows = hh.children ? [...SPEND_SHARES, SCHOOLING] : SPEND_SHARES;
  const sum = rows.reduce((a, r) => a + r.share, 0);
  return rows.map((r) => {
    const share = r.share / sum;
    return {
      label: r.label,
      hint: r.hint,
      share: Math.round(share * 100),
      amount: Math.round((total * share) / 10) * 10,
    };
  });
}

const AGE_MIN: Record<string, number> = {
  under_35: 30,
  "35_44": 35,
  "45_54": 45,
  "55_64": 55,
  "65_plus": 65,
};

export interface VisaOption {
  id: string;
  name: string;
  typeLabel: string;
  note: string;
  incomeGuide: number;
  eligibility: "likely" | "possible" | "unlikely";
  reason: string;
}

/** Which residency routes a person of this age and income could plausibly use. */
export function visaOptions(d: Destination, answers: Answers): VisaOption[] {
  const routes = VISA_ROUTES[d.country] ?? [];
  const cur = displayCurrency(answers);
  const age = AGE_MIN[str(answers, "age")] ?? 60;
  const income = INCOME_MIDPOINT[str(answers, "income")] ?? 2000;

  return routes.map((r) => {
    let eligibility: VisaOption["eligibility"] = "likely";
    const reasons: string[] = [];

    if (r.minAge && age < r.minAge) {
      eligibility = "unlikely";
      reasons.push(`typically requires age ${r.minAge}+`);
    }
    if (r.incomeGuide > 0) {
      const ratio = income / r.incomeGuide;
      if (ratio < 0.8) {
        eligibility = "unlikely";
        reasons.push("your income is below the usual threshold");
      } else if (ratio < 1.1 && eligibility !== "unlikely") {
        eligibility = "possible";
        reasons.push("your income is close to the usual threshold");
      }
    }
    if (r.requiresWork && eligibility !== "unlikely") {
      if (age >= 65) {
        eligibility = "possible";
        reasons.push("needs ongoing remote work income, not just a pension");
      } else {
        reasons.push("needs remote work income from outside the country");
      }
    }
    if (!reasons.length) reasons.push("your age and income fit the usual guidance");

    return {
      id: r.id,
      name: r.name,
      typeLabel: VISA_ROUTE_TYPE_LABEL[r.type],
      note: r.note,
      incomeGuide: r.incomeGuide,
      eligibility,
      reason: reasons.join("; "),
    };
  });
}

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
  /** Indicative category split of the spend figure shown on the card */
  breakdown: SpendCategory[];
  household: Household;
  visaOptions: VisaOption[];
  constraints: string[];
  strengths: string[];
  headline: string;
  /** Note about how familiar this region already is to the user. Never scored. */
  familiarityNote: string | null;
}

/**
 * Turns the prior-experience answer into a research framing note. Display only:
 * it never touches any factor score.
 */
export function familiarityNote(d: Destination, answers: Answers): string | null {
  const seen = list(answers, "prior_experience");
  if (!seen.length) return null;
  const region = regionForCountry(d.country);
  if (!region) return null;
  return seen.includes(region)
    ? "You already know this region — your research can focus on the practical details rather than first impressions."
    : "Worth a scouting trip before committing — this would be a bigger adjustment.";
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
  // Healthcare weight is driven solely by the dedicated healthcare question.
  if (priorities.includes("easy_residency")) w.visa += 6;
  if (priorities.includes("travel_access")) w.proximity += 3;
  if (priorities.includes("nature") || priorities.includes("food_culture")) w.lifestyle += 4;

  (Object.keys(w) as FactorKey[]).forEach((k) => {
    w[k] = Math.max(2, w[k]);
  });
  return w;
}

function scoreAffordability(d: Destination, answers: Answers) {
  const cur = displayCurrency(answers);
  const hh = household(answers);
  const couple = hh.partner;
  const income = INCOME_MIDPOINT[str(answers, "income")] ?? 2000;
  const savings = SAVINGS_MIDPOINT[str(answers, "savings")] ?? 0;
  const base = couple ? d.budget.couple : d.budget.solo;
  const low = Math.round(base[0] * hh.multiplier);
  const high = Math.round(base[1] * hh.multiplier);
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
    ? ` Based on what you spend at home today, we'd expect you to spend around ${formatMoney(projected, cur)}/month here.`
    : "";
  const note =
    ratio >= 1.2
      ? `Your income comfortably covers a typical ${hh.label} budget of ${formatMoney(low, cur)}–${formatMoney(high, cur)}/month.`
      : ratio >= 0.95
        ? `Your income roughly matches the typical budget of ${formatMoney(low, cur)}–${formatMoney(high, cur)}/month, with little slack.`
        : `Typical costs of ${formatMoney(low, cur)}–${formatMoney(high, cur)}/month run ahead of your expected income.`;

  const floor = Math.round(
    (couple ? d.affordabilityFloor.couple : d.affordabilityFloor.solo) * hh.multiplier,
  );
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
  const cur = displayCurrency(answers);
  const citizenship = citizenshipOf(answers);
  const income = INCOME_MIDPOINT[str(answers, "income")] ?? 2000;
  if (citizenship === "eu" && EU_COUNTRIES.has(d.country)) {
    return {
      score: 100,
      note: "As an EU/EEA citizen you have freedom of movement here — no visa is required, only a simple registration once you settle.",
      constrained: false,
    };
  }
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
  const hasNomadRoute = (VISA_ROUTES[d.country] ?? []).some((r) => r.type === "digital_nomad");
  if (d.visa.minAge && age < d.visa.minAge) {
    // A digital nomad route softens the blow for people moving before
    // traditional retirement age.
    score -= hasNomadRoute ? 10 : 25;
    ageIssue = true;
  }

  const tolerance = str(answers, "bureaucracy") || "medium";
  if (tolerance === "low" && d.visa.complexity >= 4) score -= 8;
  if (tolerance === "high") score += 5;


  const notes: string[] = [];
  notes.push(d.visa.label + ".");
  if (incomeGap < 1)
    notes.push(
      `Commonly referenced income guidance is around ${formatMoney(d.visa.incomeGuide, cur)}/month, above your expected income.`,
    );
  if (ageIssue)
    notes.push(
      `The main retirement route typically requires age ${d.visa.minAge}+${hasNomadRoute ? ", but a digital nomad route is available" : ""}.`,
    );

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
  // Pace and housing are no longer asked — assume a balanced pace and an
  // open mind on renting vs. buying.
  const pace = str(answers, "pace") || "balanced";
  const housing = str(answers, "housing") || "unsure";
  const priorities = list(answers, "priorities");

  const settingScore = d.settingFit[setting] ?? 60;
  const paceScore = d.paceFit[pace] ?? 60;
  const housingScore = d.housingFit[housing] ?? 70;
  const priorityScore = priorities.length
    ? priorities.reduce((sum, p) => sum + (d.priorityStrength[p] ?? 60), 0) / priorities.length
    : 70;

  const score = settingScore * 0.35 + paceScore * 0.15 + housingScore * 0.1 + priorityScore * 0.4;
  return {
    score: clamp(score),
    note: `Matches your preference for ${setting.replace("_", " ")} living and lines up with the priorities you selected.`,
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
  const region = residenceOf(answers);
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
  // Paperwork tolerance and tax sensitivity are no longer asked — assume a
  // middling tolerance for admin and no strong tax preference.
  const tolerance = str(answers, "bureaucracy") || "medium";
  const taxSensitivity = str(answers, "tax") || "medium";
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
  const cur = displayCurrency(answers);
  const weights = computeWeights(answers);
  const hh = household(answers);


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
      `Your expected income sits below the realistic floor of about ${formatMoney(aff.floor, cur)}/month for a ${hh.label} here. This is a blocking issue, not a small gap.`,
    );
    overall = Math.min(overall, 45);
  }
  if (visa.constrained) {
    constraints.push(
      `Income evidence for the main residency route is typically around ${formatMoney(d.visa.incomeGuide, cur)}/month, well above your expected income. Alternative routes would need investigating.`,
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

  const budgetRange: [number, number] = [
    Math.floor(aff.low / 50) * 50,
    Math.ceil(aff.high / 50) * 50,
  ];


  return {
    destination: d,
    overall: Math.round(overall),
    factors,
    budgetRange,
    projectedSpend: aff.projected,
    breakdown: spendBreakdown(aff.projected ?? (aff.low + aff.high) / 2, hh),
    household: hh,
    visaOptions: visaOptions(d, answers),
    constraints,
    strengths,
    headline,
  };

}

import { FACTOR_LABELS as FACTOR_LABELS_LOCAL } from "@/data/destinations";

export function rankDestinations(answers: Answers): DestinationResult[] {
  return DESTINATIONS.map((d) => scoreDestination(d, answers)).sort((a, b) => b.overall - a.overall);
}

/**
 * Picks the headline matches from a ranked list, showing at most one city per
 * country first so the top three aren't three towns in the same place. If that
 * leaves fewer than `count`, the next-best cities fill the remaining slots.
 */
export function topMatches(results: DestinationResult[], count = 3): DestinationResult[] {
  const seen = new Set<string>();
  const picked: DestinationResult[] = [];
  for (const r of results) {
    if (picked.length === count) break;
    if (seen.has(r.destination.country)) continue;
    seen.add(r.destination.country);
    picked.push(r);
  }
  for (const r of results) {
    if (picked.length === count) break;
    if (!picked.includes(r)) picked.push(r);
  }
  return picked;
}

