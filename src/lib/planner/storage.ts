/**
 * Versioned LOCAL persistence for the planner. This is device-only storage —
 * the UI says "Saved on this device". There is no cloud sync and no account
 * entitlement behind it. JSON export/import lets the user keep their plan.
 */
import { DESTINATIONS } from "@/data/destinations";
import {
  PLANNER_SCHEMA_VERSION,
  type CityScenario,
  type HouseholdProfile,
  type SavedPlan,
} from "./types";
import { seedBudget } from "./city-adapters";

const KEY = "ran.planner.v1";
export const MAX_SAVED_SCENARIOS = 3;

export function defaultProfile(): HouseholdProfile {
  return {
    homeCountry: "AU",
    currency: "AUD",
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
    returnRateAnnual: 0.05,
    inflationAnnual: 0.03,
    prefilledFromQuiz: false,
    confirmedByUser: false,
  };
}

export function newScenario(cityId: string, household: HouseholdProfile["household"]): CityScenario {
  const city = DESTINATIONS.find((d) => d.id === cityId) ?? DESTINATIONS[0]!;
  return {
    id: `${city.id}-${Date.now().toString(36)}`,
    cityId: city.id,
    budget: seedBudget(city, household),
    movingSetupCost: 0,
    rentalDeposit: 0,
    visaFundsReserve: null,
    lifestyleAdjustPct: 0,
    fxStressPct: 0,
    expenseStressPct: 0,
  };
}

const num = (v: unknown, fallback: number): number =>
  typeof v === "number" && Number.isFinite(v) ? v : fallback;

const maybeNum = (v: unknown): number | null =>
  typeof v === "number" && Number.isFinite(v) ? v : null;

/** Repairs anything stale or invalid rather than trusting the stored blob. */
export function sanitizePlan(raw: unknown): SavedPlan | null {
  if (!raw || typeof raw !== "object") return null;
  const data = raw as Partial<SavedPlan>;
  if (data.version !== PLANNER_SCHEMA_VERSION) return null;
  const base = defaultProfile();
  const p = (data.profile ?? {}) as Partial<HouseholdProfile>;
  const profile: HouseholdProfile = {
    ...base,
    ...p,
    currentAge: maybeNum(p.currentAge),
    moveAge: maybeNum(p.moveAge),
    accessibleFunds: maybeNum(p.accessibleFunds),
    retirementFunds: maybeNum(p.retirementFunds),
    retirementAccessAge: maybeNum(p.retirementAccessAge),
    monthlyIncomeNow: maybeNum(p.monthlyIncomeNow),
    laterIncomeStartAge: maybeNum(p.laterIncomeStartAge),
    laterIncomeMonthly: Math.max(0, num(p.laterIncomeMonthly, 0)),
    netRentMonthly: Math.max(0, num(p.netRentMonthly, 0)),
    netSaleProceeds: Math.max(0, num(p.netSaleProceeds, 0)),
    preMoveMonthlySaving: Math.max(0, num(p.preMoveMonthlySaving, 0)),
    ongoingHomeExpensesMonthly: Math.max(0, num(p.ongoingHomeExpensesMonthly, 0)),
    emergencyReserve: Math.max(0, num(p.emergencyReserve, 0)),
    horizonYears: Math.min(60, Math.max(1, num(p.horizonYears, 25))),
    returnRateAnnual: num(p.returnRateAnnual, 0.05),
    inflationAnnual: Math.max(0, num(p.inflationAnnual, 0.03)),
  };

  const scenarios = (Array.isArray(data.scenarios) ? data.scenarios : [])
    .filter((entry) => entry && typeof entry.name === "string" && entry.scenario)
    // Drop scenarios pointing at cities that no longer exist.
    .filter((entry) => DESTINATIONS.some((d) => d.id === entry.scenario.cityId))
    .slice(0, MAX_SAVED_SCENARIOS)
    .map((entry) => {
      const fallback = newScenario(entry.scenario.cityId, profile.household);
      const s = entry.scenario;
      return {
        name: entry.name.slice(0, 60),
        scenario: {
          ...fallback,
          ...s,
          budget: { ...fallback.budget, ...(s.budget ?? {}) },
          visaFundsReserve: maybeNum(s.visaFundsReserve),
          movingSetupCost: Math.max(0, num(s.movingSetupCost, 0)),
          rentalDeposit: Math.max(0, num(s.rentalDeposit, 0)),
          lifestyleAdjustPct: num(s.lifestyleAdjustPct, 0),
          fxStressPct: Math.max(0, num(s.fxStressPct, 0)),
          expenseStressPct: Math.max(0, num(s.expenseStressPct, 0)),
        },
      };
    });

  return { version: PLANNER_SCHEMA_VERSION, profile, scenarios, savedAt: data.savedAt ?? "" };
}

export function loadPlan(): SavedPlan | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    return sanitizePlan(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function savePlan(plan: Omit<SavedPlan, "version" | "savedAt">): SavedPlan {
  const full: SavedPlan = {
    version: PLANNER_SCHEMA_VERSION,
    profile: plan.profile,
    scenarios: plan.scenarios.slice(0, MAX_SAVED_SCENARIOS),
    savedAt: new Date().toISOString(),
  };
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(full));
    } catch {
      /* storage unavailable */
    }
  }
  return full;
}

export function clearPlan() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
}

export function exportPlanJson(plan: SavedPlan): string {
  return JSON.stringify(plan, null, 2);
}

export function importPlanJson(text: string): SavedPlan | null {
  try {
    return sanitizePlan(JSON.parse(text));
  } catch {
    return null;
  }
}
