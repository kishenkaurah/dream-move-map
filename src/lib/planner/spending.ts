import type { CityScenario, HouseholdProfile } from "./types";
import { profileSchema, scenarioSchema } from "./storage";
import { fxStressMultiplier } from "./fx";

const incomeSchema = profileSchema.pick({
  monthlyIncomeNow: true,
  currentAge: true,
  moveAge: true,
  homeProperty: true,
  netRentMonthly: true,
  laterIncomeMonthly: true,
  laterIncomeStartAge: true,
  laterIncomeConfirmed: true,
  ongoingHomeExpensesMonthly: true,
  inflationAnnual: true,
});
/** Same timing and nominal cashflow assumptions as the monthly projection. */
export function incomeAtMove(p: HouseholdProfile) {
  if (
    !incomeSchema.safeParse(p).success ||
    p.monthlyIncomeNow === null ||
    p.currentAge === null ||
    p.moveAge === null ||
    p.moveAge < p.currentAge
  )
    return null;
  const months = Math.round((p.moveAge - p.currentAge) * 12);
  const age = p.currentAge + months / 12;
  const inflationFactor = Math.pow(Math.pow(1 + p.inflationAnnual, 1 / 12), months);
  const rent = p.homeProperty === "rent" ? p.netRentMonthly : 0;
  const later =
    p.laterIncomeConfirmed && p.laterIncomeStartAge !== null && p.laterIncomeStartAge <= age + 1e-9
      ? p.laterIncomeMonthly
      : 0;
  const income = p.monthlyIncomeNow + rent + later;
  const homeCosts = p.ongoingHomeExpensesMonthly * inflationFactor;
  return { rent, later, income, homeCosts, available: income - homeCosts, inflationFactor };
}
export function citySpending(p: HouseholdProfile, s: CityScenario) {
  const funds = incomeAtMove(p);
  if (
    !funds ||
    !scenarioSchema.safeParse(s).success ||
    !Number.isFinite(p.usdRate) ||
    p.usdRate < 0.0001 ||
    p.usdRate > 10000
  )
    return null;
  const factor =
    p.usdRate *
    funds.inflationFactor *
    fxStressMultiplier(s.fxStressPct) *
    (1 + s.lifestyleAdjustPct / 100) *
    (1 + s.expenseStressPct / 100);
  const lines = Object.entries(s.budget)
    .filter(([key]) => key !== "contingencyPct")
    .map(([key, value]) => ({
      key,
      amount: (value * factor) / (key === "annualReturnTravel" ? 12 : 1),
    }));
  const base = lines.reduce((sum, line) => sum + line.amount, 0);
  const contingency = (base * s.budget.contingencyPct) / 100;
  const total = base + contingency;
  // Editable fields are today's home-currency prices; reverse future inflation
  // and stress to express housing headroom in those same units.
  const otherUsd = Object.entries(s.budget)
    .filter(([key]) => key !== "housing" && key !== "contingencyPct")
    .reduce((sum, [key, value]) => sum + value / (key === "annualReturnTravel" ? 12 : 1), 0);
  const housingLimitToday =
    (funds.available / (factor * (1 + s.budget.contingencyPct / 100)) - otherUsd) * p.usdRate;
  return {
    ...funds,
    lines,
    contingency,
    total,
    remaining: funds.available - total,
    housingLimitToday,
  };
}
