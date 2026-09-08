/** Device-only persistence. Validate imports and never report a failed write as saved. */
import { z } from "zod";
import {
  PLANNER_SCHEMA_VERSION,
  type CityScenario,
  type HouseholdProfile,
  type SavedPlan,
} from "./types";
import { cityById, isDetailed, seedBudget } from "./city-adapters";
import { usdRateFor } from "./fx";

export const PLANNER_STORAGE_KEY = "ran.planner.v2";
export const MAX_SAVED_SCENARIOS = 3;
const money = z.number().finite().min(0).max(1e10);
const age = z.number().finite().min(18).max(120);
export const profileSchema = z.object({
  homeCountry: z.enum(["AU", "OTHER"]),
  currency: z.enum(["AUD", "USD", "GBP", "EUR"]),
  usdRate: z.number().finite().min(0.0001).max(10000),
  currentAge: age.nullable(),
  moveAge: age.nullable(),
  household: z.enum(["solo", "couple", "family"]),
  accessibleFunds: money.nullable(),
  retirementFunds: money.nullable(),
  retirementAccessAge: age.nullable(),
  retirementAccessConfirmed: z.boolean(),
  monthlyIncomeNow: money.nullable(),
  laterIncomeMonthly: money,
  laterIncomeStartAge: age.nullable(),
  laterIncomeConfirmed: z.boolean(),
  homeProperty: z.enum(["none", "keep", "rent", "sell"]),
  netRentMonthly: z.number().finite().min(-1e8).max(1e8),
  netSaleProceeds: money,
  preMoveMonthlySaving: money,
  ongoingHomeExpensesMonthly: money,
  emergencyReserve: money,
  horizonYears: z.number().int().min(1).max(60),
  returnRateAnnual: z.number().finite().min(-0.9).max(0.5),
  withdrawalRateAnnual: z.number().finite().min(0).max(0.2).default(0.04),
  inflationAnnual: z.number().finite().min(0).max(0.3),
  prefilledFromQuiz: z.boolean(),
  confirmedByUser: z.boolean(),
});
export const scenarioSchema = z.object({
  id: z.string().min(1).max(100),
  cityId: z.string().refine((id) => {
    const city = cityById(id);
    return city !== undefined && isDetailed(city.country);
  }, "This city does not support detailed planning yet."),
  autoAllocate: z.boolean().default(true),
  rentalBedrooms: z.number().int().min(1).max(4).nullable().default(null),
  budget: z.object({
    housing: money,
    groceriesDining: money,
    utilities: money,
    transport: money,
    healthcare: money,
    leisure: money,
    annualReturnTravel: money,
    otherAdmin: money,
    contingencyPct: z.number().finite().min(0).max(100),
  }),
  movingSetupCost: money,
  rentalDeposit: money,
  visaFundsReserve: money.nullable(),
  lifestyleAdjustPct: z.number().finite().min(-30).max(30),
  fxStressPct: z.number().finite().min(0).max(40),
  expenseStressPct: z.number().finite().min(0).max(40),
});
const planSchema = z
  .object({
    version: z.literal(PLANNER_SCHEMA_VERSION),
    profile: profileSchema,
    scenarios: z
      .array(z.object({ name: z.string().trim().min(1).max(60), scenario: scenarioSchema }))
      .max(MAX_SAVED_SCENARIOS),
    draft: scenarioSchema.nullable(),
    savedAt: z.string().datetime(),
  })
  .refine(
    (p) => new Set(p.scenarios.map((s) => s.scenario.id)).size === p.scenarios.length,
    "Duplicate scenario IDs",
  );

export function defaultProfile(): HouseholdProfile {
  return {
    homeCountry: "AU",
    currency: "AUD",
    usdRate: usdRateFor("AUD"),
    currentAge: null,
    moveAge: null,
    household: "solo",
    accessibleFunds: null,
    retirementFunds: null,
    retirementAccessAge: null,
    retirementAccessConfirmed: false,
    monthlyIncomeNow: null,
    laterIncomeMonthly: 0,
    laterIncomeStartAge: null,
    laterIncomeConfirmed: false,
    homeProperty: "none",
    netRentMonthly: 0,
    netSaleProceeds: 0,
    preMoveMonthlySaving: 0,
    ongoingHomeExpensesMonthly: 0,
    emergencyReserve: 0,
    horizonYears: 25,
    returnRateAnnual: 0.07,
    withdrawalRateAnnual: 0.04,
    inflationAnnual: 0.03,
    prefilledFromQuiz: false,
    confirmedByUser: false,
  };
}

export function newScenario(
  cityId: string,
  household: HouseholdProfile["household"],
): CityScenario {
  const city = cityById(cityId);
  if (!city || !isDetailed(city.country))
    throw new Error("Detailed planning is not available for this city.");
  return {
    id: globalThis.crypto.randomUUID(),
    cityId,
    autoAllocate: true,
    rentalBedrooms: null,
    budget: seedBudget(city, household),
    movingSetupCost: 0,
    rentalDeposit: 0,
    visaFundsReserve: null,
    lifestyleAdjustPct: 0,
    fxStressPct: 0,
    expenseStressPct: 0,
  };
}
export function sanitizePlan(raw: unknown): SavedPlan | null {
  const result = planSchema.safeParse(raw);
  return result.success ? result.data : null;
}
export function loadPlan(): SavedPlan | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(PLANNER_STORAGE_KEY);
  if (!raw) return null;
  const parsed = importPlanJson(raw);
  if (!parsed)
    throw new Error(
      "The saved plan could not be read. Exported plans from older versions may need re-entering.",
    );
  return parsed;
}
export function makePlan(plan: Pick<SavedPlan, "profile" | "scenarios" | "draft">): SavedPlan {
  const valid = sanitizePlan({
    ...plan,
    version: PLANNER_SCHEMA_VERSION,
    savedAt: new Date().toISOString(),
  });
  if (!valid) throw new Error("Correct the invalid inputs before saving or exporting your plan.");
  return valid;
}
export function savePlan(plan: Pick<SavedPlan, "profile" | "scenarios" | "draft">): SavedPlan {
  const full = makePlan(plan);
  if (typeof window === "undefined") throw new Error("Saving needs a browser.");
  window.localStorage.setItem(PLANNER_STORAGE_KEY, JSON.stringify(full));
  return full;
}
export function clearPlan() {
  if (typeof window !== "undefined") window.localStorage.removeItem(PLANNER_STORAGE_KEY);
}
export function exportPlanJson(plan: SavedPlan): string {
  return JSON.stringify(plan, null, 2);
}
export function importPlanJson(text: string): SavedPlan | null {
  if (text.length > 200000) return null;
  try {
    return sanitizePlan(JSON.parse(text));
  } catch {
    return null;
  }
}
