/**
 * AFFORDABILITY PLANNER — shared types.
 *
 * Money conventions (important):
 *  - Overseas city budget items are stored in USD, because the seed data in
 *    `src/data/destinations.ts` is USD. They are converted to the user's home
 *    currency for display and are the ONLY figures affected by FX stress.
 *  - Home-country amounts (income, home expenses, savings, property) are
 *    stored in the user's chosen home currency and are never FX-stressed.
 *
 * Nothing here is advice, a quote, or a live price. Every seeded number is an
 * indicative model estimate.
 */
import type { CurrencyCode } from "@/lib/currency";

export const PLANNER_SCHEMA_VERSION = 1;

export type HomeCountry = "AU" | "OTHER";
export type HouseholdType = "solo" | "couple" | "family";
export type HomePropertyChoice = "none" | "keep" | "rent" | "sell";

/** A value the user has not confirmed yet — distinct from a confirmed zero. */
export type MaybeNumber = number | null;

export interface HouseholdProfile {
  homeCountry: HomeCountry;
  currency: CurrencyCode;
  currentAge: MaybeNumber;
  moveAge: MaybeNumber;
  household: HouseholdType;

  /** Cash + investments you can access at any time (home currency). */
  accessibleFunds: MaybeNumber;

  /** Superannuation / pension pots held separately (home currency). */
  retirementFunds: MaybeNumber;
  retirementAccessAge: MaybeNumber;
  /** True only when the user ticked "I've checked my access age". */
  retirementAccessConfirmed: boolean;

  /** After-tax recurring monthly income, EXCLUDING any withdrawals. */
  monthlyIncomeNow: MaybeNumber;

  /** Optional income that begins later (e.g. a pension you have estimated). */
  laterIncomeMonthly: number;
  laterIncomeStartAge: MaybeNumber;
  laterIncomeConfirmed: boolean;

  homeProperty: HomePropertyChoice;
  /** NET monthly rental cashflow after costs — only when homeProperty = "rent". */
  netRentMonthly: number;
  /** NET sale proceeds after costs and loans — only when homeProperty = "sell". */
  netSaleProceeds: number;

  /** Monthly saving while still at home, if the move is in the future. */
  preMoveMonthlySaving: number;

  /** Costs you keep paying at home after the move (home currency, no FX stress). */
  ongoingHomeExpensesMonthly: number;

  /** Cash you want untouched. Not an expense — a floor you get warned about. */
  emergencyReserve: number;

  horizonYears: number;

  /** Nominal annual return after fees and tax. May be negative. */
  returnRateAnnual: number;
  /** Annual inflation applied to living costs. */
  inflationAnnual: number;

  /** True when numbers were prefilled from quiz brackets and not yet confirmed. */
  prefilledFromQuiz: boolean;
  confirmedByUser: boolean;
}

export interface BudgetItems {
  housing: number;
  groceriesDining: number;
  utilities: number;
  transport: number;
  healthcare: number;
  leisure: number;
  /** ANNUAL return-home travel. Divided by 12 exactly once by the engine. */
  annualReturnTravel: number;
  otherAdmin: number;
  /** Percentage (0-100) applied to the sum of the items above. */
  contingencyPct: number;
}

export interface CityScenario {
  id: string;
  cityId: string;
  /** Monthly items in USD (annualReturnTravel is annual USD). */
  budget: BudgetItems;
  /** One-off relocation and setup spend (USD). Genuinely spent. */
  movingSetupCost: number;
  /** Refundable rental deposit (USD). Stays an asset, not spendable. */
  rentalDeposit: number;
  /** Visa funds the user has confirmed must be set aside (USD). null = unknown. */
  visaFundsReserve: MaybeNumber;
  /** Lifestyle dial: -30..+30 percent applied to the overseas budget. */
  lifestyleAdjustPct: number;
  /** Home currency buys this much less overseas (0-40 percent). */
  fxStressPct: number;
  /** Extra overseas cost stress, on top of lifestyle (0-40 percent). */
  expenseStressPct: number;
}

export interface SavedPlan {
  version: number;
  profile: HouseholdProfile;
  scenarios: { name: string; scenario: CityScenario }[];
  savedAt: string;
}
