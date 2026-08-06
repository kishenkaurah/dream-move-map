/**
 * QUESTIONNAIRE CONFIGURATION
 * ---------------------------
 * Edit question copy, order and options here. Each option `id` is what the
 * scoring engine reads, so keep ids stable when editing labels.
 *
 * Money options carry a `usd` bracket instead of a hard-coded label: the
 * assessment renders them in the user's display currency (see
 * src/lib/currency.ts). All underlying scoring values stay in USD.
 */
import { formatMoney, type CurrencyCode } from "@/lib/currency";

export interface QuestionOption {
  id: string;
  label: string;
  hint?: string;
  /** Money bracket in USD: [low, high]; null means open-ended on that side. */
  usd?: [number | null, number | null];
}

export interface Question {
  id: string;
  step: number;
  title: string;
  help?: string;
  type: "single" | "multi";
  /** For multi questions */
  maxSelections?: number;
  minSelections?: number;
  /** Show the "Amounts shown in [currency]" note */
  money?: boolean;
  options: QuestionOption[];
}

/** Renders an option label, converting money brackets to the display currency. */
export function optionLabel(opt: QuestionOption, currency: CurrencyCode): string {
  if (!opt.usd) return opt.label;
  const [low, high] = opt.usd;
  if (low === null && high !== null) return `Under ${formatMoney(high, currency)}`;
  if (high === null && low !== null) return `More than ${formatMoney(low, currency)}`;
  if (low !== null && high !== null)
    return `${formatMoney(low, currency)} – ${formatMoney(high, currency)}`;
  return opt.label;
}

const REGION_OPTIONS: QuestionOption[] = [
  { id: "us_canada", label: "United States or Canada" },
  { id: "uk", label: "United Kingdom" },
  { id: "eu", label: "European Union or EEA" },
  { id: "australia_nz", label: "Australia or New Zealand" },
  { id: "other", label: "Somewhere else" },
];

export const QUESTIONS: Question[] = [
  {
    id: "citizenship",
    step: 1,
    title: "What citizenship do you hold?",
    help: "Your citizenship determines which visas and residency pathways are open to you.",
    type: "single",
    options: REGION_OPTIONS,
  },
  {
    id: "residence",
    step: 2,
    title: "Where do you currently live?",
    help: "This shapes distance from home, flight times, and family proximity scoring.",
    type: "single",
    options: [
      { id: "same", label: "Same as my citizenship" },
      ...REGION_OPTIONS,
    ],
  },
  {
    id: "region_pref",
    step: 3,
    title: "Do you already have a region in mind?",
    help: "We still score everywhere — this only filters what we show first.",
    type: "single",
    options: [
      { id: "sea", label: "Southeast Asia" },
      { id: "europe", label: "Europe & Mediterranean" },
      { id: "latam", label: "Latin America" },
      { id: "any", label: "No preference — show me everything" },
    ],
  },
  {
    id: "age",
    step: 4,
    title: "Which age range will you be when you move?",
    help: "Retirement visas have minimum ages; younger movers often use digital nomad routes instead.",
    type: "single",
    options: [
      { id: "under_35", label: "Under 35" },
      { id: "35_44", label: "35 to 44" },
      { id: "45_54", label: "45 to 54" },
      { id: "55_64", label: "55 to 64" },
      { id: "65_plus", label: "65 or older" },
    ],
  },
  {
    id: "household",
    step: 5,
    title: "Who is moving with you?",
    type: "single",
    options: [
      { id: "solo", label: "Just me" },
      { id: "couple", label: "Me and a partner or spouse" },
      { id: "solo_kids", label: "Me and children at home" },
      { id: "couple_kids", label: "Partner and children at home" },
    ],
  },
  {
    id: "income",
    step: 6,
    title: "What monthly retirement income do you expect?",
    help: "All sources combined, after tax.",
    type: "single",
    money: true,
    options: [
      { id: "under_1500", label: "Under $1,500", usd: [null, 1500] },
      { id: "1500_2500", label: "$1,500 – $2,500", usd: [1500, 2500] },
      { id: "2500_4000", label: "$2,500 – $4,000", usd: [2500, 4000] },
      { id: "4000_6000", label: "$4,000 – $6,000", usd: [4000, 6000] },
      { id: "over_6000", label: "More than $6,000", usd: [6000, null] },
    ],
  },
  {
    id: "current_spend",
    step: 7,
    title: "What do you spend each month at home today?",
    help: "Housing, food, utilities, transport and everyday costs combined. We use this to project your spending in each city.",
    type: "single",
    money: true,
    options: [
      { id: "under_2000", label: "Under $2,000", usd: [null, 2000] },
      { id: "2000_3000", label: "$2,000 – $3,000", usd: [2000, 3000] },
      { id: "3000_4500", label: "$3,000 – $4,500", usd: [3000, 4500] },
      { id: "4500_6500", label: "$4,500 – $6,500", usd: [4500, 6500] },
      { id: "over_6500", label: "More than $6,500", usd: [6500, null] },
      { id: "unsure", label: "I'm not sure" },
    ],
  },
  {
    id: "spend_style",
    step: 8,
    title: "How would you like your spending to change abroad?",
    help: "Applied to the projection of your current costs at local prices.",
    type: "single",
    options: [
      { id: "trim", label: "Live more simply and spend less" },
      { id: "same", label: "Keep a similar lifestyle" },
      { id: "upgrade", label: "Upgrade — more comfort, help and travel" },
    ],
  },
  {
    id: "climate",
    step: 9,
    title: "What climate suits you best?",
    type: "single",
    options: [
      { id: "tropical", label: "Hot and tropical year round" },
      { id: "warm_dry", label: "Warm and dry Mediterranean" },
      { id: "mild_temperate", label: "Mild and temperate" },
      { id: "four_seasons", label: "Four distinct seasons" },
    ],
  },
  {
    id: "setting",
    step: 10,
    title: "Where would you like to wake up most mornings?",
    type: "single",
    options: [
      { id: "city", label: "In a city with everything nearby" },
      { id: "beach", label: "Near the coast" },
      { id: "small_town", label: "In a walkable small town" },
      { id: "countryside", label: "Out in the countryside" },
    ],
  },
  {
    id: "healthcare_importance",
    step: 11,
    title: "How important is healthcare quality and access?",
    type: "single",
    options: [
      { id: "low", label: "Nice to have — I'm in good health" },
      { id: "medium", label: "Moderately important" },
      { id: "high", label: "Very important" },
      { id: "critical", label: "Critical — ongoing condition or care needs" },
    ],
  },
  {
    id: "english",
    step: 12,
    title: "How much do you need English in daily life?",
    type: "single",
    options: [
      { id: "essential", label: "Essential — I need to function in English" },
      { id: "preferred", label: "Preferred, but I'll manage" },
      { id: "willing", label: "Happy to learn the local language" },
    ],
  },
  {
    id: "family_proximity",
    step: 13,
    title: "How important is staying within easy reach of family?",
    type: "single",
    options: [
      { id: "very", label: "Very — I want short, affordable flights" },
      { id: "somewhat", label: "Somewhat — a yearly trip is fine" },
      { id: "not", label: "Not important — distance doesn't worry me" },
    ],
  },
  {
    id: "priorities",
    step: 14,
    title: "What matters most in your next chapter?",
    help: "Choose up to three.",
    type: "multi",
    minSelections: 1,
    maxSelections: 3,
    options: [
      { id: "cost", label: "Stretching my money further" },
      { id: "healthcare", label: "Healthcare confidence" },
      { id: "safety", label: "Safety and stability" },
      { id: "community", label: "An established community" },
      { id: "food_culture", label: "Food and culture" },
      { id: "nature", label: "Nature and the outdoors" },
      { id: "travel_access", label: "Easy travel access" },
      { id: "easy_residency", label: "A simple residency path" },
    ],
  },
];

export const TOTAL_STEPS = QUESTIONS.length;

export type Answers = Record<string, string | string[] | undefined>;

/** Defaults applied when a question hasn't been answered yet. */
export const DEFAULT_ANSWERS: Answers = {
  residence: "same",
  region_pref: "any",
};
