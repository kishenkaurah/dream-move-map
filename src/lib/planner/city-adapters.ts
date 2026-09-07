/**
 * COUNTRY / CITY ADAPTERS for the affordability planner.
 *
 * Every number here is derived from the existing indicative city budget data
 * in `src/data/destinations.ts`. They are MODEL ESTIMATES, not researched
 * quotes and not live prices. Where we do not genuinely know a check date or a
 * source, the adapter says so rather than stamping today's date.
 *
 * "Detailed planning" (beta) is currently configured for Thailand, Malaysia
 * and Portugal only, because those are the countries whose cost breakdowns we
 * have gone through item by item. Every other destination in the quiz stays
 * visible with an indicative budget only.
 */
import { DESTINATIONS, type Destination } from "@/data/destinations";
import type { BudgetItems, HouseholdType } from "./types";
import type { LocalCurrencyCode } from "./fx";

export const DETAILED_COUNTRIES = ["Thailand", "Malaysia", "Portugal"] as const;
export type DetailedCountry = (typeof DETAILED_COUNTRIES)[number];

export interface OfficialLink {
  label: string;
  url: string;
  /** We only ever claim "verified" for links the owner has actually checked. */
  status: "verified" | "unverified";
}

export interface CountryAdapter {
  country: string;
  status: "detailed_beta" | "indicative_only";
  localCurrency: LocalCurrencyCode | null;
  /** Where the budget model came from. */
  provenance: string;
  /** Null when no genuine check date is known. Never stamped automatically. */
  dataCheckedOn: string | null;
  /** Cost lines we know are missing and the user must supply. */
  knownGaps: string[];
  officialLinks: OfficialLink[];
}

const HOME_LINKS: OfficialLink[] = [
  {
    label: "Services Australia — Age Pension when you leave Australia",
    url: "https://www.servicesaustralia.gov.au/when-you-leave-australia-if-you-get-age-pension?context=22526",
    status: "verified",
  },
];

const ADAPTERS: Record<string, CountryAdapter> = {
  Thailand: {
    country: "Thailand",
    status: "detailed_beta",
    localCurrency: "THB",
    provenance:
      "Modelled from the app's own indicative Thai city budget bands, split into line items by category share.",
    dataCheckedOn: null,
    knownGaps: [
      "Private health insurance premiums at your age — get a written quote.",
      "Long-stay rental prices for the exact area and lease length you want.",
      "The visa route's financial requirement in the year you apply.",
    ],
    officialLinks: [
      {
        label: "Royal Thai Embassy, Canberra — visa information",
        url: "https://canberra.thaiembassy.org/en/content/visa",
        status: "verified",
      },
    ],
  },
  Malaysia: {
    country: "Malaysia",
    status: "detailed_beta",
    localCurrency: "MYR",
    provenance:
      "Modelled from the app's own indicative Malaysian city budget bands, split into line items by category share.",
    dataCheckedOn: null,
    knownGaps: [
      "MM2H / other long-stay pass financial requirements — unverified in this app.",
      "Private health cover at your age, including pre-existing conditions.",
      "Condo rental and service-charge quotes for your target building.",
    ],
    officialLinks: [],
  },
  Portugal: {
    country: "Portugal",
    status: "detailed_beta",
    localCurrency: "EUR",
    provenance:
      "Modelled from the app's own indicative Portuguese city budget bands, split into line items by category share.",
    dataCheckedOn: null,
    knownGaps: [
      "Residency route income thresholds — unverified in this app.",
      "Private health insurance and any state scheme access.",
      "Rental market pricing, which has moved quickly in Lisbon and Porto.",
    ],
    officialLinks: [],
  },
};

export function adapterFor(country: string): CountryAdapter {
  const found = ADAPTERS[country];
  if (found) return found;
  return {
    country,
    status: "indicative_only",
    localCurrency: null,
    provenance: "Indicative city budget band from the destination dataset only.",
    dataCheckedOn: null,
    knownGaps: ["Detailed line-item planning is not configured for this country yet."],
    officialLinks: [],
  };
}

export function homeCountryLinks(): OfficialLink[] {
  return HOME_LINKS;
}

export function isDetailed(country: string): boolean {
  return adapterFor(country).status === "detailed_beta";
}

export function cityById(id: string): Destination | undefined {
  return DESTINATIONS.find((d) => d.id === id);
}

export function detailedCities(): Destination[] {
  return DESTINATIONS.filter((d) => isDetailed(d.country));
}

/** Household cost multiplier, matching the quiz's own family uplift. */
export function householdMultiplier(h: HouseholdType): number {
  return h === "family" ? 1.3 : 1;
}

/**
 * Category shares of a monthly city budget. Return-home flights are NOT in
 * `leisure` — they are a separate annual line, so they cannot be counted twice.
 */
const SHARES = {
  housing: 0.34,
  groceriesDining: 0.28,
  utilities: 0.07,
  transport: 0.07,
  healthcare: 0.11,
  leisure: 0.07,
  otherAdmin: 0.06,
} as const;

/** Midpoint of the city's own indicative band for this household, in USD. */
export function seedMonthlyTotal(d: Destination, household: HouseholdType): number {
  const band = household === "solo" ? d.budget.solo : d.budget.couple;
  const mid = (band[0] + band[1]) / 2;
  return mid * householdMultiplier(household);
}

/**
 * Seeds an editable line-item budget from the indicative city band.
 * `annualReturnTravel` starts at 0 on purpose: we do not know where the user
 * flies from, and inventing a flight cost would be false precision. The UI
 * flags it as a missing input.
 */
export function seedBudget(d: Destination, household: HouseholdType): BudgetItems {
  const total = seedMonthlyTotal(d, household);
  const round = (n: number) => Math.round(n);
  return {
    housing: round(total * SHARES.housing),
    groceriesDining: round(total * SHARES.groceriesDining),
    utilities: round(total * SHARES.utilities),
    transport: round(total * SHARES.transport),
    healthcare: round(total * SHARES.healthcare),
    leisure: round(total * SHARES.leisure),
    annualReturnTravel: 0,
    otherAdmin: round(total * SHARES.otherAdmin),
    contingencyPct: 5,
  };
}

export const BUDGET_LABELS: Record<keyof Omit<BudgetItems, "contingencyPct">, string> = {
  housing: "Housing (rent, strata, maintenance)",
  groceriesDining: "Groceries & eating out",
  utilities: "Utilities & internet",
  transport: "Local transport",
  healthcare: "Healthcare & insurance",
  leisure: "Leisure & hobbies (excludes flights home)",
  annualReturnTravel: "Return-home travel (per YEAR)",
  otherAdmin: "Other & admin (visa fees, paperwork)",
};
