/**
 * DESTINATION CONFIGURATION
 * -------------------------
 * This is the single place to edit destination data: budgets, visa info,
 * ratings, copy, and constraints. The scoring engine (src/lib/scoring.ts)
 * reads only from this file, so adding a new destination is as simple as
 * appending another object to `DESTINATIONS`.
 *
 * Rating scales:
 *  - All 1-5 ratings: 1 = weakest / hardest, 5 = strongest / easiest
 *  - `climateFit` / `settingFit` / `paceFit`: 0-100 fit score per option id
 *  - Budgets are indicative monthly USD totals for a comfortable-but-modest
 *    retirement lifestyle (housing, food, utilities, local transport, basic care).
 *
 * All figures are educational estimates and must be independently verified.
 */

export type HomeRegion = "us_canada" | "uk" | "eu" | "australia_nz" | "other";

export interface Destination {
  id: string;
  name: string;
  country: string;
  emoji: string;
  tagline: string;
  /** Indicative monthly living cost range in USD */
  budget: {
    solo: [number, number];
    couple: [number, number];
  };
  /** Below this monthly income, affordability is treated as a hard constraint */
  affordabilityFloor: { solo: number; couple: number };
  visa: {
    /** 1 = simplest, 5 = most complex */
    complexity: number;
    label: string;
    /** Indicative monthly income commonly referenced for retirement-type permits (USD) */
    incomeGuide: number;
    /** Typical minimum age referenced by the main retirement route, if any */
    minAge?: number;
    note: string;
  };
  healthcare: { rating: number; label: string };
  /** How widely English is usable day to day (1-5) */
  english: number;
  /** 1 = light-touch admin, 5 = heavy paperwork culture */
  bureaucracy: number;
  /** 1 = large cultural adjustment, 5 = gentle adjustment for Western retirees */
  culturalEase: number;
  /** 1 = tax-heavy for foreign retirees, 5 = generally tax-light */
  taxFriendliness: number;
  /** 0-100 fit per climate answer id */
  climateFit: Record<string, number>;
  /** 0-100 fit per setting answer id */
  settingFit: Record<string, number>;
  /** 0-100 fit per pace answer id */
  paceFit: Record<string, number>;
  /** 0-100 fit per housing answer id */
  housingFit: Record<string, number>;
  /** Indicative one-way travel time in hours from each home region */
  travelHours: Record<HomeRegion, number>;
  /** 0-100 strength per priority answer id */
  priorityStrength: Record<string, number>;
  advantages: string[];
  compromises: string[];
  investigate: string[];
  summary: string;
}

export const DESTINATIONS: Destination[] = [
  {
    id: "thailand",
    name: "Thailand",
    country: "Thailand",
    emoji: "🇹🇭",
    tagline: "Low costs, warm winters and world-class private hospitals",
    budget: { solo: [1100, 2200], couple: [1600, 3000] },
    affordabilityFloor: { solo: 900, couple: 1300 },
    /** Local cost level vs. a US baseline of 100 (used to project your current spending forward) */
    costIndex: 40,
    visa: {
      complexity: 3,
      label: "Moderate — annual renewals",
      incomeGuide: 2000,
      minAge: 50,
      note: "Retirement-type extensions typically require age 50+, a deposit or monthly income evidence, and yearly renewal with 90-day reporting.",
    },
    healthcare: { rating: 4, label: "Excellent private care in major hubs" },
    english: 3,
    bureaucracy: 3,
    culturalEase: 3,
    taxFriendliness: 4,
    climateFit: { tropical: 100, warm_dry: 55, mild_temperate: 30, four_seasons: 10 },
    settingFit: { city: 85, beach: 95, countryside: 80, small_town: 80 },
    paceFit: { relaxed: 90, balanced: 85, lively: 80 },
    housingFit: { rent: 95, buy: 45, unsure: 75 },
    travelHours: { us_canada: 20, uk: 13, eu: 12, australia_nz: 9, other: 14 },
    priorityStrength: {
      cost: 100,
      healthcare: 85,
      safety: 70,
      community: 80,
      food_culture: 95,
      nature: 85,
      travel_access: 90,
      easy_residency: 60,
    },
    advantages: [
      "One of the lowest costs of living among popular retirement destinations",
      "Large, established expat communities in Chiang Mai, Hua Hin and Phuket",
      "Highly regarded private hospitals with short waiting times",
      "Excellent regional travel access across Asia",
    ],
    compromises: [
      "Foreigners generally cannot own land outright",
      "Annual visa renewals and 90-day reporting create ongoing admin",
      "Hot, humid climate year round with a heavy rainy season",
      "Thai language needed outside tourist and expat hubs",
    ],
    investigate: [
      "Which retirement visa route fits your income and deposit situation?",
      "What does comprehensive private health insurance cost at your age?",
      "How do long-stay leases and condo ownership rules work for foreigners?",
      "How is your pension treated under current Thai remittance tax guidance?",
    ],
    summary:
      "Thailand pairs very low living costs with strong private healthcare, at the price of ongoing visa admin and a significant cultural and climate adjustment.",
  },
  {
    id: "portugal",
    name: "Portugal",
    country: "Portugal",
    emoji: "🇵🇹",
    tagline: "Mild Atlantic climate, EU healthcare and a gentle pace",
    budget: { solo: [1700, 2900], couple: [2300, 3900] },
    affordabilityFloor: { solo: 1500, couple: 2000 },
    /** Local cost level vs. a US baseline of 100 (used to project your current spending forward) */
    costIndex: 62,
    visa: {
      complexity: 3,
      label: "Moderate — passive income route",
      incomeGuide: 1200,
      note: "The passive-income (D7) style route asks for stable income, proof of accommodation and health cover, then in-country renewals.",
    },
    healthcare: { rating: 4, label: "Strong public system plus affordable private" },
    english: 4,
    bureaucracy: 4,
    culturalEase: 5,
    taxFriendliness: 3,
    climateFit: { tropical: 25, warm_dry: 95, mild_temperate: 100, four_seasons: 60 },
    settingFit: { city: 85, beach: 90, countryside: 85, small_town: 90 },
    paceFit: { relaxed: 90, balanced: 90, lively: 70 },
    housingFit: { rent: 80, buy: 90, unsure: 85 },
    travelHours: { us_canada: 8, uk: 2.5, eu: 3, australia_nz: 24, other: 10 },
    priorityStrength: {
      cost: 65,
      healthcare: 85,
      safety: 95,
      community: 90,
      food_culture: 90,
      nature: 85,
      travel_access: 90,
      easy_residency: 80,
    },
    advantages: [
      "Consistently ranked among the safest countries in the world",
      "Mild, walkable coastal living with genuine four-season variety inland",
      "Residency route leads toward long-term EU status over time",
      "Widely spoken English in Lisbon, Porto and the Algarve",
    ],
    compromises: [
      "Housing costs in Lisbon and the Algarve have risen sharply",
      "Paperwork and appointment queues can be slow and repetitive",
      "Winters are damp and homes are often poorly insulated",
      "Tax treatment of foreign pensions has changed in recent years",
    ],
    investigate: [
      "What income evidence does the current passive-income route require?",
      "How would your pension be taxed as a Portuguese tax resident?",
      "Which regions still fit your housing budget outside the hotspots?",
      "How do you register with the public health system after residency?",
    ],
    summary:
      "Portugal offers safety, a gentle Atlantic climate and a clear residency pathway, balanced against rising housing costs and slow administration.",
  },
  {
    id: "malaysia",
    name: "Malaysia",
    country: "Malaysia",
    emoji: "🇲🇾",
    tagline: "English-friendly, affordable and remarkably easy to settle into",
    budget: { solo: [1200, 2300], couple: [1700, 3100] },
    affordabilityFloor: { solo: 950, couple: 1350 },
    /** Local cost level vs. a US baseline of 100 (used to project your current spending forward) */
    costIndex: 42,
    visa: {
      complexity: 4,
      label: "Higher — financial thresholds apply",
      incomeGuide: 2500,
      note: "The long-stay programme has periodically changed its income, deposit and property thresholds; terms vary by tier and state.",
    },
    healthcare: { rating: 4, label: "High-quality, low-cost private hospitals" },
    english: 5,
    bureaucracy: 3,
    culturalEase: 4,
    taxFriendliness: 5,
    climateFit: { tropical: 100, warm_dry: 45, mild_temperate: 35, four_seasons: 5 },
    settingFit: { city: 90, beach: 85, countryside: 70, small_town: 75 },
    paceFit: { relaxed: 80, balanced: 90, lively: 85 },
    housingFit: { rent: 90, buy: 80, unsure: 85 },
    travelHours: { us_canada: 21, uk: 13, eu: 13, australia_nz: 8, other: 14 },
    priorityStrength: {
      cost: 90,
      healthcare: 85,
      safety: 75,
      community: 75,
      food_culture: 90,
      nature: 80,
      travel_access: 90,
      easy_residency: 55,
    },
    advantages: [
      "English is widely used in daily life, healthcare and government services",
      "Foreigners can own freehold property in most states, subject to price floors",
      "Modern infrastructure at a fraction of Western costs",
      "Foreign-sourced income is generally treated favourably",
    ],
    compromises: [
      "Long-stay visa rules have changed repeatedly and can be unpredictable",
      "Hot and humid all year with no seasonal relief",
      "Alcohol is taxed heavily and some regions are more conservative",
      "Long-haul distance from North America and Europe",
    ],
    investigate: [
      "What are the current long-stay programme thresholds and deposit terms?",
      "Which states apply which minimum property purchase prices?",
      "What private insurance is available for pre-existing conditions?",
      "How is your foreign pension treated under current tax rules?",
    ],
    summary:
      "Malaysia is unusually easy for English speakers and very affordable, but its long-stay visa programme is the least predictable of the five.",
  },
  {
    id: "costa_rica",
    name: "Costa Rica",
    country: "Costa Rica",
    emoji: "🇨🇷",
    tagline: "Nature-first living within easy reach of North America",
    budget: { solo: [1600, 2800], couple: [2100, 3600] },
    affordabilityFloor: { solo: 1300, couple: 1800 },
    /** Local cost level vs. a US baseline of 100 (used to project your current spending forward) */
    costIndex: 58,
    visa: {
      complexity: 2,
      label: "Simpler — clear pension route",
      incomeGuide: 1000,
      note: "The pensionado route is built around a verifiable lifetime pension; income must usually be exchanged locally and renewals apply.",
    },
    healthcare: { rating: 4, label: "Good public (Caja) plus solid private care" },
    english: 3,
    bureaucracy: 4,
    culturalEase: 4,
    taxFriendliness: 4,
    climateFit: { tropical: 95, warm_dry: 60, mild_temperate: 85, four_seasons: 20 },
    settingFit: { city: 65, beach: 95, countryside: 95, small_town: 85 },
    paceFit: { relaxed: 100, balanced: 75, lively: 45 },
    housingFit: { rent: 85, buy: 85, unsure: 85 },
    travelHours: { us_canada: 5, uk: 12, eu: 12, australia_nz: 22, other: 12 },
    priorityStrength: {
      cost: 65,
      healthcare: 80,
      safety: 75,
      community: 85,
      food_culture: 70,
      nature: 100,
      travel_access: 75,
      easy_residency: 85,
    },
    advantages: [
      "One of the clearest and most established pension-based residency routes",
      "Short flights to North America for family visits",
      "Outstanding nature, biodiversity and outdoor living",
      "Residents can enrol in the public Caja healthcare system",
    ],
    compromises: [
      "Imported goods, cars and electronics are expensive",
      "Rural roads, humidity and infrastructure gaps take adjusting to",
      "Spanish is essential outside expat pockets",
      "Petty crime is a real consideration in some areas",
    ],
    investigate: [
      "Does your pension qualify as lifetime income for the pensionado route?",
      "What are current Caja contribution rates at your income level?",
      "Which regions balance climate, safety and your housing budget?",
      "How does US or Canadian tax filing interact with Costa Rican residency?",
    ],
    summary:
      "Costa Rica suits nature-oriented retirees who want a straightforward pension visa and short flights home, at a mid-range cost level.",
  },
  {
    id: "spain",
    name: "Spain",
    country: "Spain",
    emoji: "🇪🇸",
    tagline: "Big-country infrastructure, superb healthcare, Mediterranean rhythm",
    budget: { solo: [1900, 3200], couple: [2500, 4300] },
    affordabilityFloor: { solo: 1700, couple: 2300 },
    /** Local cost level vs. a US baseline of 100 (used to project your current spending forward) */
    costIndex: 66,
    visa: {
      complexity: 4,
      label: "Higher — consulate-led, income tested",
      incomeGuide: 2400,
      note: "The non-lucrative route requires substantial proven passive income, private health cover, and generally forbids working.",
    },
    healthcare: { rating: 5, label: "Among the best-rated systems worldwide" },
    english: 3,
    bureaucracy: 5,
    culturalEase: 5,
    taxFriendliness: 2,
    climateFit: { tropical: 20, warm_dry: 100, mild_temperate: 85, four_seasons: 70 },
    settingFit: { city: 95, beach: 90, countryside: 80, small_town: 85 },
    paceFit: { relaxed: 80, balanced: 90, lively: 95 },
    housingFit: { rent: 80, buy: 85, unsure: 82 },
    travelHours: { us_canada: 8.5, uk: 2.5, eu: 2.5, australia_nz: 24, other: 10 },
    priorityStrength: {
      cost: 55,
      healthcare: 100,
      safety: 90,
      community: 90,
      food_culture: 100,
      nature: 80,
      travel_access: 95,
      easy_residency: 55,
    },
    advantages: [
      "World-class healthcare and dense specialist coverage",
      "Excellent trains, airports and walkable cities",
      "Deep cultural life, food and social outdoor culture",
      "Very large, well-established international retiree communities",
    ],
    compromises: [
      "Heaviest paperwork of the five, with consulate-stage income tests",
      "Worldwide income and asset reporting for tax residents",
      "Higher living costs than the Asian and Latin American options",
      "Spanish is necessary for healthcare and administration",
    ],
    investigate: [
      "What is the current non-lucrative visa income threshold for your household?",
      "How would Spanish tax residency treat your pensions and investments?",
      "Which regions meet your budget outside Madrid, Barcelona and Mallorca?",
      "What private health policy satisfies the visa requirement?",
    ],
    summary:
      "Spain delivers the strongest healthcare and infrastructure of the five, but demands the highest income evidence and the most tax and paperwork tolerance.",
  },
];

/** Global scoring weights — edit here to retune the model. */
export const BASE_WEIGHTS = {
  affordability: 22,
  visa: 16,
  healthcare: 14,
  lifestyle: 14,
  climate: 12,
  language: 8,
  proximity: 7,
  bureaucracy: 7,
} as const;

export type FactorKey = keyof typeof BASE_WEIGHTS;

export const FACTOR_LABELS: Record<FactorKey, string> = {
  affordability: "Affordability",
  visa: "Visa compatibility",
  healthcare: "Healthcare",
  lifestyle: "Lifestyle fit",
  climate: "Climate",
  language: "Language & integration",
  proximity: "Proximity to family",
  bureaucracy: "Bureaucracy tolerance",
};
