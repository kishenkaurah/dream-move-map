/**
 * DESTINATION CONFIGURATION (CITY LEVEL)
 * --------------------------------------
 * This is the single place to edit destination data: budgets, visa info,
 * ratings, copy, and constraints. The scoring engine (src/lib/scoring.ts)
 * reads only from this file, so adding a new city is as simple as
 * appending another object to `DESTINATIONS`.
 *
 * Each entry is a CITY (or a well-defined local area), not a whole country.
 * Visa and tax fields are national and therefore shared by cities in the same
 * country; budgets, climate, setting, pace and housing are city-specific.
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
  /** City or local area name */
  name: string;
  country: string;
  /** Country flag emoji */
  emoji: string;
  tagline: string;
  /** Indicative monthly living cost range in USD */
  budget: {
    solo: [number, number];
    couple: [number, number];
  };
  /** Below this monthly income, affordability is treated as a hard constraint */
  affordabilityFloor: { solo: number; couple: number };
  /** Local cost level relative to a US baseline of 100 */
  costIndex: number;
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

/** National visa rules, shared by every city in that country. */
const VISA = {
  thailand: {
    complexity: 3,
    label: "Moderate — annual renewals",
    incomeGuide: 2000,
    minAge: 50,
    note: "Retirement-type extensions typically require age 50+, a deposit or monthly income evidence, and yearly renewal with 90-day reporting.",
  },
  portugal: {
    complexity: 3,
    label: "Moderate — passive income route",
    incomeGuide: 1200,
    note: "The passive-income (D7) style route asks for stable income, proof of accommodation and health cover, then in-country renewals.",
  },
  malaysia: {
    complexity: 4,
    label: "Higher — financial thresholds apply",
    incomeGuide: 2500,
    note: "The long-stay programme has periodically changed its income, deposit and property thresholds; terms vary by tier and state.",
  },
  costa_rica: {
    complexity: 2,
    label: "Simpler — clear pension route",
    incomeGuide: 1000,
    note: "The pensionado route is built around a verifiable lifetime pension; income must usually be exchanged locally and renewals apply.",
  },
  spain: {
    complexity: 4,
    label: "Higher — consulate-led, income tested",
    incomeGuide: 2400,
    note: "The non-lucrative route requires substantial proven passive income, private health cover, and generally forbids working.",
  },
  mexico: {
    complexity: 2,
    label: "Simpler — consulate income test",
    incomeGuide: 2600,
    note: "Temporary and permanent residency are granted at consulates abroad based on income or savings thresholds that change with the local minimum wage.",
  },
  panama: {
    complexity: 1,
    label: "Simplest — pensionado programme",
    incomeGuide: 1000,
    note: "The pensionado programme accepts a lifetime pension of around $1,000 a month and grants permanent status with a well-known discount package.",
  },
  greece: {
    complexity: 3,
    label: "Moderate — EU passive income route",
    incomeGuide: 2200,
    note: "The financially independent person route requires proven passive income, health cover and in-country renewals; a flat-tax pension regime may apply.",
  },
  vietnam: {
    complexity: 5,
    label: "Hardest — no retirement visa",
    incomeGuide: 1500,
    note: "Vietnam has no retirement visa; most retirees rely on repeated temporary visas or a sponsored route, which adds real long-term uncertainty.",
  },
  colombia: {
    complexity: 2,
    label: "Simpler — pension-based M visa",
    incomeGuide: 900,
    note: "The pensioner (M) visa is built on a verified pension of roughly three times the minimum wage, renewable and leading toward residency.",
  },
} satisfies Record<string, Destination["visa"]>;

const TRAVEL = {
  thailand: { us_canada: 20, uk: 13, eu: 12, australia_nz: 9, other: 14 },
  portugal: { us_canada: 8, uk: 2.5, eu: 3, australia_nz: 24, other: 10 },
  malaysia: { us_canada: 21, uk: 13, eu: 13, australia_nz: 8, other: 14 },
  costa_rica: { us_canada: 5, uk: 12, eu: 12, australia_nz: 22, other: 12 },
  spain: { us_canada: 8.5, uk: 2.5, eu: 2.5, australia_nz: 24, other: 10 },
  mexico: { us_canada: 4, uk: 11, eu: 12, australia_nz: 22, other: 12 },
  panama: { us_canada: 5.5, uk: 12, eu: 12, australia_nz: 23, other: 13 },
  greece: { us_canada: 11, uk: 3.5, eu: 2.5, australia_nz: 22, other: 8 },
  vietnam: { us_canada: 20, uk: 13, eu: 12.5, australia_nz: 9, other: 14 },
  colombia: { us_canada: 5.5, uk: 11, eu: 11, australia_nz: 24, other: 13 },
} satisfies Record<string, Record<HomeRegion, number>>;


export const DESTINATIONS: Destination[] = [
  /* ---------------------------------------------------------------- Thailand */
  {
    id: "chiang_mai",
    name: "Chiang Mai",
    country: "Thailand",
    emoji: "🇹🇭",
    tagline: "Thailand's cheapest expat hub, ringed by mountains and temples",
    budget: { solo: [1000, 1900], couple: [1400, 2600] },
    affordabilityFloor: { solo: 800, couple: 1150 },
    costIndex: 35,
    visa: VISA.thailand,
    healthcare: { rating: 4, label: "Strong private hospitals at low cost" },
    english: 3,
    bureaucracy: 3,
    culturalEase: 3,
    taxFriendliness: 4,
    climateFit: { tropical: 90, warm_dry: 70, mild_temperate: 45, four_seasons: 20 },
    settingFit: { city: 80, beach: 20, countryside: 85, small_town: 85 },
    paceFit: { relaxed: 95, balanced: 85, lively: 60 },
    housingFit: { rent: 95, buy: 45, unsure: 75 },
    travelHours: TRAVEL.thailand,
    priorityStrength: {
      cost: 100,
      healthcare: 85,
      safety: 80,
      community: 90,
      food_culture: 95,
      nature: 90,
      travel_access: 75,
      easy_residency: 60,
    },
    advantages: [
      "Among the lowest living costs of any established retirement hub",
      "Large, long-standing Western retiree community with clubs and services",
      "Well-regarded private hospitals with short waiting times",
      "Mountains, national parks and cooler nights than the south",
    ],
    compromises: [
      "Severe seasonal burning smog from roughly February to April",
      "Foreigners generally cannot own land outright",
      "Annual visa renewals and 90-day reporting",
      "No coast — the sea is a flight away",
    ],
    investigate: [
      "How badly would the burning-season air quality affect your health?",
      "Which retirement visa route fits your income or deposit situation?",
      "What does comprehensive private health insurance cost at your age?",
      "How is your pension treated under current Thai remittance tax guidance?",
    ],
    summary:
      "Chiang Mai offers the strongest cost-to-comfort ratio in Thailand with a deep expat network, offset by a genuinely poor air-quality season.",
  },
  {
    id: "hua_hin",
    name: "Hua Hin",
    country: "Thailand",
    emoji: "🇹🇭",
    tagline: "Quiet beach town pace, three hours from Bangkok's hospitals",
    budget: { solo: [1100, 2100], couple: [1550, 2800] },
    affordabilityFloor: { solo: 900, couple: 1250 },
    costIndex: 40,
    visa: VISA.thailand,
    healthcare: { rating: 4, label: "Good local private care, Bangkok nearby" },
    english: 3,
    bureaucracy: 3,
    culturalEase: 4,
    taxFriendliness: 4,
    climateFit: { tropical: 100, warm_dry: 60, mild_temperate: 30, four_seasons: 5 },
    settingFit: { city: 45, beach: 95, countryside: 65, small_town: 90 },
    paceFit: { relaxed: 100, balanced: 75, lively: 40 },
    housingFit: { rent: 90, buy: 55, unsure: 80 },
    travelHours: TRAVEL.thailand,
    priorityStrength: {
      cost: 90,
      healthcare: 80,
      safety: 85,
      community: 85,
      food_culture: 80,
      nature: 75,
      travel_access: 70,
      easy_residency: 60,
    },
    advantages: [
      "Calm, low-crime seaside town popular with older retirees",
      "Drier and less humid than most of the Thai coast",
      "Golf, walking promenades and an easy day-to-day rhythm",
      "Three hours by road to Bangkok's international hospitals",
    ],
    compromises: [
      "Quiet to the point of dull if you want nightlife or culture",
      "Fewer specialist medical services than Bangkok",
      "Foreigners cannot own land outright",
      "Limited direct international flights — you route via Bangkok",
    ],
    investigate: [
      "Is the town's slower pace right for you year round, not just on holiday?",
      "How do long-stay leases and condo ownership rules work for foreigners?",
      "What is the realistic travel time to specialist care in an emergency?",
      "Which visa route fits your income and deposit situation?",
    ],
    summary:
      "Hua Hin trades city amenities for a calm, affordable beach life within reach of Bangkok's medical infrastructure.",
  },
  {
    id: "bangkok",
    name: "Bangkok",
    country: "Thailand",
    emoji: "🇹🇭",
    tagline: "World-class hospitals and transport at Asian prices",
    budget: { solo: [1300, 2600], couple: [1800, 3400] },
    affordabilityFloor: { solo: 1050, couple: 1450 },
    costIndex: 46,
    visa: VISA.thailand,
    healthcare: { rating: 5, label: "Internationally rated private hospitals" },
    english: 3,
    bureaucracy: 3,
    culturalEase: 3,
    taxFriendliness: 4,
    climateFit: { tropical: 100, warm_dry: 40, mild_temperate: 20, four_seasons: 5 },
    settingFit: { city: 100, beach: 25, countryside: 15, small_town: 25 },
    paceFit: { relaxed: 40, balanced: 80, lively: 100 },
    housingFit: { rent: 95, buy: 55, unsure: 80 },
    travelHours: TRAVEL.thailand,
    priorityStrength: {
      cost: 80,
      healthcare: 100,
      safety: 70,
      community: 85,
      food_culture: 100,
      nature: 40,
      travel_access: 100,
      easy_residency: 60,
    },
    advantages: [
      "Some of the best private hospitals in Asia, with English-speaking specialists",
      "Metro and rail network makes car-free living realistic",
      "Extraordinary food scene at every price point",
      "Major air hub — cheap flights across Asia and beyond",
    ],
    compromises: [
      "Heat, humidity, traffic and seasonal air pollution",
      "Noisy and intense compared with the rest of Thailand",
      "Higher rents than elsewhere in the country",
      "Annual visa renewals and 90-day reporting",
    ],
    investigate: [
      "Which neighbourhoods balance quiet with metro access at your budget?",
      "What private insurance covers you at the top-tier hospitals?",
      "How would air quality and heat affect any existing condition?",
      "How is your pension treated under current Thai remittance tax guidance?",
    ],
    summary:
      "Bangkok is the strongest healthcare and connectivity option in Southeast Asia, if you accept big-city heat, noise and pollution.",
  },

  /* ---------------------------------------------------------------- Portugal */
  {
    id: "lisbon",
    name: "Lisbon",
    country: "Portugal",
    emoji: "🇵🇹",
    tagline: "Hills, light and culture with EU healthcare on the doorstep",
    budget: { solo: [1900, 3200], couple: [2500, 4200] },
    affordabilityFloor: { solo: 1700, couple: 2250 },
    costIndex: 70,
    visa: VISA.portugal,
    healthcare: { rating: 5, label: "Major public hospitals plus affordable private" },
    english: 4,
    bureaucracy: 4,
    culturalEase: 5,
    taxFriendliness: 3,
    climateFit: { tropical: 20, warm_dry: 95, mild_temperate: 100, four_seasons: 55 },
    settingFit: { city: 100, beach: 75, countryside: 30, small_town: 45 },
    paceFit: { relaxed: 65, balanced: 95, lively: 90 },
    housingFit: { rent: 65, buy: 75, unsure: 70 },
    travelHours: TRAVEL.portugal,
    priorityStrength: {
      cost: 50,
      healthcare: 95,
      safety: 95,
      community: 90,
      food_culture: 95,
      nature: 65,
      travel_access: 100,
      easy_residency: 80,
    },
    advantages: [
      "Capital-city healthcare with specialist coverage and English-speaking clinics",
      "Direct flights to North America and across Europe",
      "Very safe, walkable and rich in culture, music and food",
      "Residency route leads toward long-term EU status over time",
    ],
    compromises: [
      "The most expensive housing market in Portugal, and still rising",
      "Steep hills and cobbles are hard going with limited mobility",
      "Damp, poorly insulated winter housing stock",
      "Paperwork and appointment queues can be slow and repetitive",
    ],
    investigate: [
      "What does a long-term rental actually cost in the districts you'd consider?",
      "How would your pension be taxed as a Portuguese tax resident?",
      "How do you register with the public health system after residency?",
      "Are the hills workable for you in ten or fifteen years' time?",
    ],
    summary:
      "Lisbon gives you the best connectivity and healthcare in Portugal, at the country's highest housing cost.",
  },
  {
    id: "porto",
    name: "Porto",
    country: "Portugal",
    emoji: "🇵🇹",
    tagline: "Lisbon's culture and care for noticeably less money",
    budget: { solo: [1650, 2800], couple: [2200, 3700] },
    affordabilityFloor: { solo: 1450, couple: 1950 },
    costIndex: 62,
    visa: VISA.portugal,
    healthcare: { rating: 4, label: "Strong public system plus affordable private" },
    english: 4,
    bureaucracy: 4,
    culturalEase: 5,
    taxFriendliness: 3,
    climateFit: { tropical: 10, warm_dry: 65, mild_temperate: 100, four_seasons: 75 },
    settingFit: { city: 90, beach: 75, countryside: 55, small_town: 65 },
    paceFit: { relaxed: 80, balanced: 95, lively: 75 },
    housingFit: { rent: 80, buy: 85, unsure: 82 },
    travelHours: TRAVEL.portugal,
    priorityStrength: {
      cost: 65,
      healthcare: 85,
      safety: 95,
      community: 85,
      food_culture: 90,
      nature: 80,
      travel_access: 85,
      easy_residency: 80,
    },
    advantages: [
      "Meaningfully cheaper than Lisbon with the same residency and health system",
      "Compact, walkable historic centre with a strong food and wine culture",
      "Beaches and the Douro valley both within easy reach",
      "Growing but still manageable international community",
    ],
    compromises: [
      "Wettest of the Portuguese options — grey Atlantic winters",
      "Cold, damp housing without proper heating",
      "Fewer direct long-haul flights than Lisbon",
      "Portuguese is needed more often than in the Algarve",
    ],
    investigate: [
      "Can you live happily through a wet Atlantic winter?",
      "What heating and insulation would a property you like actually need?",
      "How would your pension be taxed as a Portuguese tax resident?",
      "Which neighbourhoods fit your housing budget?",
    ],
    summary:
      "Porto is the value pick in Portugal: near-identical benefits to Lisbon, lower costs, and a wetter, greyer winter.",
  },
  {
    id: "algarve",
    name: "Algarve (Lagos & Tavira)",
    country: "Portugal",
    emoji: "🇵🇹",
    tagline: "Sunniest corner of Europe with an established retiree scene",
    budget: { solo: [1750, 3000], couple: [2350, 4000] },
    affordabilityFloor: { solo: 1550, couple: 2100 },
    costIndex: 65,
    visa: VISA.portugal,
    healthcare: { rating: 4, label: "Good regional hospitals, private clinics common" },
    english: 5,
    bureaucracy: 4,
    culturalEase: 5,
    taxFriendliness: 3,
    climateFit: { tropical: 25, warm_dry: 100, mild_temperate: 90, four_seasons: 45 },
    settingFit: { city: 40, beach: 100, countryside: 80, small_town: 95 },
    paceFit: { relaxed: 100, balanced: 80, lively: 55 },
    housingFit: { rent: 75, buy: 90, unsure: 82 },
    travelHours: TRAVEL.portugal,
    priorityStrength: {
      cost: 60,
      healthcare: 80,
      safety: 95,
      community: 100,
      food_culture: 80,
      nature: 85,
      travel_access: 85,
      easy_residency: 80,
    },
    advantages: [
      "The largest and most settled English-speaking retiree community in Portugal",
      "Around 300 sunny days a year and mild winters",
      "English works almost everywhere in daily life",
      "Faro airport gives direct access to the UK and northern Europe",
    ],
    compromises: [
      "Heavily seasonal — crowded in summer, quiet in winter",
      "Property prices in the popular towns have risen sharply",
      "Specialist healthcare often means travelling to Lisbon",
      "A car is close to essential outside the town centres",
    ],
    investigate: [
      "Which towns stay lively in winter rather than shutting down?",
      "How far is the nearest hospital with the specialists you may need?",
      "What do year-round (not holiday) rentals cost in your target town?",
      "How would your pension be taxed as a Portuguese tax resident?",
    ],
    summary:
      "The Algarve is the easiest soft landing in Europe for English speakers, at the cost of seasonality and thinner specialist care.",
  },

  /* ---------------------------------------------------------------- Malaysia */
  {
    id: "penang",
    name: "Penang (George Town)",
    country: "Malaysia",
    emoji: "🇲🇾",
    tagline: "Heritage island city, famous food, hospitals at a fraction of the cost",
    budget: { solo: [1100, 2100], couple: [1500, 2800] },
    affordabilityFloor: { solo: 900, couple: 1250 },
    costIndex: 39,
    visa: VISA.malaysia,
    healthcare: { rating: 4, label: "Medical-tourism hospitals at very low cost" },
    english: 5,
    bureaucracy: 3,
    culturalEase: 4,
    taxFriendliness: 5,
    climateFit: { tropical: 100, warm_dry: 40, mild_temperate: 25, four_seasons: 5 },
    settingFit: { city: 80, beach: 85, countryside: 55, small_town: 80 },
    paceFit: { relaxed: 85, balanced: 90, lively: 70 },
    housingFit: { rent: 90, buy: 85, unsure: 88 },
    travelHours: TRAVEL.malaysia,
    priorityStrength: {
      cost: 95,
      healthcare: 90,
      safety: 80,
      community: 85,
      food_culture: 100,
      nature: 70,
      travel_access: 80,
      easy_residency: 55,
    },
    advantages: [
      "English is used everywhere, including hospitals and government offices",
      "One of Asia's great food cities, with a UNESCO heritage core",
      "Foreigners can own freehold property, subject to price floors",
      "Established, sociable expat community on a manageable island",
    ],
    compromises: [
      "Hot and humid all year with no seasonal relief",
      "Long-stay visa rules have changed repeatedly and can be unpredictable",
      "Island traffic and patchy pavements make walking harder than it looks",
      "Long-haul distance from North America and Europe",
    ],
    investigate: [
      "What are the current long-stay programme thresholds and deposit terms?",
      "What minimum property purchase price applies in Penang state?",
      "What private insurance is available for pre-existing conditions?",
      "How is your foreign pension treated under current tax rules?",
    ],
    summary:
      "Penang is the best-value English-speaking option on this list, held back only by Malaysia's unpredictable long-stay visa.",
  },
  {
    id: "kuala_lumpur",
    name: "Kuala Lumpur",
    country: "Malaysia",
    emoji: "🇲🇾",
    tagline: "Modern capital living with first-rate hospitals and cheap flights",
    budget: { solo: [1300, 2500], couple: [1800, 3300] },
    affordabilityFloor: { solo: 1050, couple: 1450 },
    costIndex: 45,
    visa: VISA.malaysia,
    healthcare: { rating: 5, label: "Top-tier private hospitals, English-speaking" },
    english: 5,
    bureaucracy: 3,
    culturalEase: 4,
    taxFriendliness: 5,
    climateFit: { tropical: 100, warm_dry: 40, mild_temperate: 25, four_seasons: 5 },
    settingFit: { city: 100, beach: 20, countryside: 25, small_town: 30 },
    paceFit: { relaxed: 50, balanced: 90, lively: 95 },
    housingFit: { rent: 95, buy: 85, unsure: 90 },
    travelHours: TRAVEL.malaysia,
    priorityStrength: {
      cost: 85,
      healthcare: 95,
      safety: 80,
      community: 80,
      food_culture: 95,
      nature: 55,
      travel_access: 100,
      easy_residency: 55,
    },
    advantages: [
      "Excellent private hospitals with short waits and English throughout",
      "Modern condos with pools and gyms at a fraction of Western prices",
      "Major low-cost airline hub for regional and long-haul travel",
      "Foreign-sourced income is generally treated favourably",
    ],
    compromises: [
      "Car-dependent sprawl outside the rail corridors",
      "Hot, humid and prone to afternoon downpours year round",
      "Alcohol is taxed heavily and some areas are conservative",
      "Long-stay visa terms can change with little warning",
    ],
    investigate: [
      "Which districts keep you within walking distance of rail and shops?",
      "What are the current long-stay programme thresholds and deposit terms?",
      "What private insurance is available for pre-existing conditions?",
      "How is your foreign pension treated under current tax rules?",
    ],
    summary:
      "Kuala Lumpur combines top-tier healthcare, English and low costs — a strong pick if you want a city rather than a beach.",
  },

  /* -------------------------------------------------------------- Costa Rica */
  {
    id: "central_valley",
    name: "Central Valley (Atenas & Grecia)",
    country: "Costa Rica",
    emoji: "🇨🇷",
    tagline: "Spring-like weather year round, close to the capital's hospitals",
    budget: { solo: [1500, 2600], couple: [2000, 3400] },
    affordabilityFloor: { solo: 1250, couple: 1700 },
    costIndex: 55,
    visa: VISA.costa_rica,
    healthcare: { rating: 4, label: "Public Caja plus private hospitals near San José" },
    english: 3,
    bureaucracy: 4,
    culturalEase: 4,
    taxFriendliness: 4,
    climateFit: { tropical: 55, warm_dry: 75, mild_temperate: 100, four_seasons: 30 },
    settingFit: { city: 40, beach: 25, countryside: 100, small_town: 95 },
    paceFit: { relaxed: 100, balanced: 70, lively: 35 },
    housingFit: { rent: 85, buy: 90, unsure: 87 },
    travelHours: TRAVEL.costa_rica,
    priorityStrength: {
      cost: 70,
      healthcare: 85,
      safety: 80,
      community: 90,
      food_culture: 65,
      nature: 95,
      travel_access: 80,
      easy_residency: 85,
    },
    advantages: [
      "Famously mild highland climate — warm days, cool nights, no air conditioning",
      "Under an hour from San José's private hospitals and the main airport",
      "Long-established North American retiree towns with support networks",
      "Residents can enrol in the public Caja healthcare system",
    ],
    compromises: [
      "Spanish is essential outside the expat pockets",
      "Imported goods, cars and electronics are expensive",
      "Hilly rural roads and a car-dependent lifestyle",
      "Not the place for beach living — the coast is a two-hour drive",
    ],
    investigate: [
      "Does your pension qualify as lifetime income for the pensionado route?",
      "What are current Caja contribution rates at your income level?",
      "How much would importing or buying a suitable vehicle cost?",
      "How does US or Canadian tax filing interact with Costa Rican residency?",
    ],
    summary:
      "The Central Valley is Costa Rica's practical choice: gentle climate, real healthcare access and an established retiree network.",
  },
  {
    id: "tamarindo",
    name: "Tamarindo & Guanacaste",
    country: "Costa Rica",
    emoji: "🇨🇷",
    tagline: "Pacific beach living with direct flights to North America",
    budget: { solo: [1800, 3200], couple: [2400, 4100] },
    affordabilityFloor: { solo: 1500, couple: 2050 },
    costIndex: 66,
    visa: VISA.costa_rica,
    healthcare: { rating: 3, label: "Decent regional clinics; serious care means San José" },
    english: 4,
    bureaucracy: 4,
    culturalEase: 4,
    taxFriendliness: 4,
    climateFit: { tropical: 100, warm_dry: 85, mild_temperate: 45, four_seasons: 10 },
    settingFit: { city: 20, beach: 100, countryside: 75, small_town: 85 },
    paceFit: { relaxed: 95, balanced: 75, lively: 60 },
    housingFit: { rent: 80, buy: 80, unsure: 80 },
    travelHours: TRAVEL.costa_rica,
    priorityStrength: {
      cost: 45,
      healthcare: 65,
      safety: 70,
      community: 85,
      food_culture: 65,
      nature: 100,
      travel_access: 85,
      easy_residency: 85,
    },
    advantages: [
      "Dry-season sunshine and warm Pacific beaches on your doorstep",
      "Liberia airport offers direct flights to several US and Canadian cities",
      "Widely spoken English in the beach towns and a big expat scene",
      "Outstanding surfing, wildlife and outdoor living",
    ],
    compromises: [
      "The most expensive area in Costa Rica — tourist pricing year round",
      "Serious medical care means a long drive or flight to San José",
      "Intense heat and a dusty dry season, then heavy rains",
      "Petty crime and seasonal tourist churn are real considerations",
    ],
    investigate: [
      "How far is the nearest hospital equipped for an emergency?",
      "What do year-round rentals cost outside the tourist season?",
      "Does your pension qualify as lifetime income for the pensionado route?",
      "How does US or Canadian tax filing interact with Costa Rican residency?",
    ],
    summary:
      "Guanacaste is the beach dream with genuine flight convenience, but it is Costa Rica's priciest region and thin on specialist care.",
  },

  /* ------------------------------------------------------------------- Spain */
  {
    id: "valencia",
    name: "Valencia",
    country: "Spain",
    emoji: "🇪🇸",
    tagline: "Beach, big-city healthcare and Spain's best value among major cities",
    budget: { solo: [1750, 3000], couple: [2300, 3900] },
    affordabilityFloor: { solo: 1550, couple: 2100 },
    costIndex: 63,
    visa: VISA.spain,
    healthcare: { rating: 5, label: "Among the best-rated systems worldwide" },
    english: 3,
    bureaucracy: 5,
    culturalEase: 5,
    taxFriendliness: 2,
    climateFit: { tropical: 20, warm_dry: 100, mild_temperate: 90, four_seasons: 55 },
    settingFit: { city: 95, beach: 90, countryside: 40, small_town: 55 },
    paceFit: { relaxed: 75, balanced: 100, lively: 85 },
    housingFit: { rent: 80, buy: 88, unsure: 84 },
    travelHours: TRAVEL.spain,
    priorityStrength: {
      cost: 65,
      healthcare: 100,
      safety: 95,
      community: 85,
      food_culture: 95,
      nature: 75,
      travel_access: 90,
      easy_residency: 55,
    },
    advantages: [
      "Cheaper than Madrid or Barcelona with the same healthcare and infrastructure",
      "Flat, bikeable city with a beach and a huge riverbed park",
      "Excellent trains and a growing international community",
      "Mild winters and a strong outdoor food culture",
    ],
    compromises: [
      "Heaviest paperwork of any country here, with consulate-stage income tests",
      "Worldwide income and asset reporting for tax residents",
      "Spanish (and often Valencian) is needed for healthcare and admin",
      "Summers are hot and humid, and rents have climbed fast",
    ],
    investigate: [
      "What is the current non-lucrative visa income threshold for your household?",
      "How would Spanish tax residency treat your pensions and investments?",
      "What private health policy satisfies the visa requirement?",
      "Which neighbourhoods still fit your housing budget?",
    ],
    summary:
      "Valencia is the sweet spot in Spain: world-class healthcare and city life at a materially lower cost than Madrid or Barcelona.",
  },
  {
    id: "malaga",
    name: "Málaga & Costa del Sol",
    country: "Spain",
    emoji: "🇪🇸",
    tagline: "Warmest winters in mainland Europe with a huge international scene",
    budget: { solo: [1900, 3300], couple: [2500, 4300] },
    affordabilityFloor: { solo: 1700, couple: 2300 },
    costIndex: 68,
    visa: VISA.spain,
    healthcare: { rating: 5, label: "Strong public hospitals plus many private clinics" },
    english: 4,
    bureaucracy: 5,
    culturalEase: 5,
    taxFriendliness: 2,
    climateFit: { tropical: 30, warm_dry: 100, mild_temperate: 85, four_seasons: 40 },
    settingFit: { city: 85, beach: 100, countryside: 60, small_town: 80 },
    paceFit: { relaxed: 80, balanced: 90, lively: 95 },
    housingFit: { rent: 72, buy: 85, unsure: 78 },
    travelHours: TRAVEL.spain,
    priorityStrength: {
      cost: 50,
      healthcare: 95,
      safety: 90,
      community: 100,
      food_culture: 95,
      nature: 80,
      travel_access: 95,
      easy_residency: 55,
    },
    advantages: [
      "The mildest winters on the Spanish mainland, with sun most of the year",
      "Very large, well-established international retiree community",
      "English is widely usable along the coast, unusually so for Spain",
      "Málaga airport connects directly across Europe and to North America",
    ],
    compromises: [
      "Housing costs are among the fastest-rising in Spain",
      "Crowded and heavily touristed through the summer",
      "Worldwide income and asset reporting for tax residents",
      "Heavy paperwork and consulate-stage income testing",
    ],
    investigate: [
      "What is the current non-lucrative visa income threshold for your household?",
      "Which towns along the coast fit your budget year round?",
      "How would Spanish tax residency treat your pensions and investments?",
      "What private health policy satisfies the visa requirement?",
    ],
    summary:
      "Málaga offers Europe's most comfortable winter climate and the easiest Spanish landing for English speakers, at a premium price.",
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
