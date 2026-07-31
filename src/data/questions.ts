/**
 * QUESTIONNAIRE CONFIGURATION
 * ---------------------------
 * Edit question copy, order and options here. Each option `id` is what the
 * scoring engine reads, so keep ids stable when editing labels.
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
    id: "savings",
    step: 5,
    title: "Roughly what savings or investments will you have?",
    help: "Some visa routes accept savings in place of income.",
    type: "single",
    options: [
      { id: "under_50k", label: "Under $50,000" },
      { id: "50_150k", label: "$50,000 – $150,000" },
      { id: "150_500k", label: "$150,000 – $500,000" },
      { id: "over_500k", label: "More than $500,000" },
    ],
  },
  {
    id: "climate",
    step: 6,
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
    step: 7,
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
    step: 8,
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
    step: 9,
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
    step: 10,
    title: "How important is staying within easy reach of family?",
    type: "single",
    options: [
      { id: "very", label: "Very — I want short, affordable flights" },
      { id: "somewhat", label: "Somewhat — a yearly trip is fine" },
      { id: "not", label: "Not important — distance doesn't worry me" },
    ],
  },
  {
    id: "housing",
    step: 11,
    title: "Do you expect to rent or buy?",
    type: "single",
    options: [
      { id: "rent", label: "Rent — keep it flexible" },
      { id: "buy", label: "Buy a home" },
      { id: "unsure", label: "Not sure yet" },
    ],
  },
  {
    id: "pace",
    step: 12,
    title: "What pace of life are you after?",
    type: "single",
    options: [
      { id: "relaxed", label: "Slow and quiet" },
      { id: "balanced", label: "Balanced — some buzz, some calm" },
      { id: "lively", label: "Lively and social" },
    ],
  },
  {
    id: "bureaucracy",
    step: 13,
    title: "How much paperwork and cultural adjustment can you tolerate?",
    help: "Residency renewals, translations, appointments and local admin.",
    type: "single",
    options: [
      { id: "low", label: "Very little — I want it simple" },
      { id: "medium", label: "Some — if the payoff is worth it" },
      { id: "high", label: "A lot — I find it part of the adventure" },
    ],
  },
  {
    id: "tax",
    step: 14,
    title: "How sensitive are you to taxation of your retirement income?",
    type: "single",
    options: [
      { id: "low", label: "Not a major factor" },
      { id: "medium", label: "Somewhat — I'd like to keep it efficient" },
      { id: "high", label: "Very — tax treatment could decide it" },
    ],
  },
  {
    id: "timeframe",
    step: 15,
    title: "When do you intend to relocate?",
    type: "single",
    options: [
      { id: "within_6", label: "Within 6 months" },
      { id: "6_12", label: "In 6 to 12 months" },
      { id: "1_2y", label: "In 1 to 2 years" },
      { id: "exploring", label: "Still exploring the idea" },
    ],
  },
  {
    id: "priorities",
    step: 16,
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
