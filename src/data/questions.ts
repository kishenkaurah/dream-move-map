/**
 * QUESTIONNAIRE CONFIGURATION
 * ---------------------------
 * Edit question copy, order and options here. Each option `id` is what the
 * scoring engine reads, so keep ids stable when editing labels.
 *
 * Kept deliberately short (12 steps). Anything the engine can infer or safely
 * default is not asked — see src/lib/scoring.ts for those defaults.
 */

export interface QuestionOption {
  id: string;
  label: string;
  hint?: string;
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
  options: QuestionOption[];
}

export const QUESTIONS: Question[] = [
  {
    id: "home_region",
    step: 1,
    title: "Where do you currently live and hold citizenship?",
    help: "This shapes visa options and how far you'd be from home.",
    type: "single",
    options: [
      { id: "us_canada", label: "United States or Canada" },
      { id: "uk", label: "United Kingdom" },
      { id: "eu", label: "European Union / EEA" },
      { id: "australia_nz", label: "Australia or New Zealand" },
      { id: "other", label: "Somewhere else" },
    ],
  },
  {
    id: "age",
    step: 2,
    title: "Which age range will you be when you move?",
    help: "Several retirement visas have minimum age requirements.",
    type: "single",
    options: [
      { id: "under_55", label: "Under 55" },
      { id: "55_59", label: "55 to 59" },
      { id: "60_64", label: "60 to 64" },
      { id: "65_69", label: "65 to 69" },
      { id: "70_plus", label: "70 or older" },
    ],
  },
  {
    id: "household",
    step: 3,
    title: "Are you moving solo or with a partner?",
    type: "single",
    options: [
      { id: "solo", label: "Solo" },
      { id: "couple", label: "With a partner or spouse" },
    ],
  },
  {
    id: "income",
    step: 4,
    title: "What monthly retirement income do you expect?",
    help: "All sources combined, after tax, in US dollars.",
    type: "single",
    options: [
      { id: "under_1500", label: "Under $1,500" },
      { id: "1500_2500", label: "$1,500 – $2,500" },
      { id: "2500_4000", label: "$2,500 – $4,000" },
      { id: "4000_6000", label: "$4,000 – $6,000" },
      { id: "over_6000", label: "More than $6,000" },
    ],
  },
  {
    id: "current_spend",
    step: 5,
    title: "What do you spend each month at home today?",
    help: "Housing, food, utilities, transport and everyday costs combined, in US dollars. We use this to project your spending in each city.",
    type: "single",
    options: [
      { id: "under_2000", label: "Under $2,000" },
      { id: "2000_3000", label: "$2,000 – $3,000" },
      { id: "3000_4500", label: "$3,000 – $4,500" },
      { id: "4500_6500", label: "$4,500 – $6,500" },
      { id: "over_6500", label: "More than $6,500" },
      { id: "unsure", label: "I'm not sure" },
    ],
  },
  {
    id: "spend_style",
    step: 6,
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
    step: 7,
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
    step: 8,
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
    step: 9,
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
    step: 10,
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
    step: 11,
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
    step: 12,
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
