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
const savingsSchema = profileSchema.pick({
  accessibleFunds: true,
  retirementFunds: true,
  retirementAccessAge: true,
  retirementAccessConfirmed: true,
  currentAge: true,
  moveAge: true,
  returnRateAnnual: true,
  withdrawalRateAnnual: true,
  preMoveMonthlySaving: true,
  homeProperty: true,
  netSaleProceeds: true,
  usdRate: true,
});
/** Project the initial withdrawal base; later actual spending is deducted by the engine. */
export function savingsAtMove(p: HouseholdProfile, s?: CityScenario | null) {
  if (
    !savingsSchema.safeParse(p).success ||
    p.accessibleFunds === null ||
    p.currentAge === null ||
    p.moveAge === null ||
    p.moveAge < p.currentAge ||
    (s && !scenarioSchema.safeParse(s).success)
  )
    return null;
  const months = Math.round((p.moveAge - p.currentAge) * 12);
  const age = p.currentAge + months / 12;
  const unlocked =
    p.retirementAccessConfirmed &&
    p.retirementAccessAge !== null &&
    age + 1e-9 >= p.retirementAccessAge;
  if (unlocked && p.retirementFunds === null) return null;
  const growth = Math.pow(1 + p.returnRateAnnual, 1 / 12);
  let accessible = p.accessibleFunds;
  let retirement = p.retirementFunds ?? 0;
  for (let m = 0; m < months; m++) {
    accessible = (accessible + p.preMoveMonthlySaving) * growth;
    retirement *= growth;
  }
  if (p.homeProperty === "sell") accessible += p.netSaleProceeds;
  const moveCosts = s
    ? (s.movingSetupCost + s.rentalDeposit + (s.visaFundsReserve ?? 0)) *
      p.usdRate *
      fxStressMultiplier(s.fxStressPct)
    : 0;
  const base = Math.max(0, accessible + (unlocked ? retirement : 0) - moveCosts);
  const rate = p.withdrawalRateAnnual ?? 0.04;
  return { base, monthly: (base * rate) / 12, todayMonthly: (p.accessibleFunds * rate) / 12, rate };
}
/** Same timing and nominal cashflow assumptions as the monthly projection. */
export function incomeAtMove(p: HouseholdProfile, s?: CityScenario | null) {
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
  const savings = savingsAtMove(p, s);
  const savingsMonthly = savings?.monthly ?? 0;
  return {
    rent,
    later,
    income,
    homeCosts,
    savings,
    savingsMonthly,
    totalSpendingPower: income + savingsMonthly,
    available: income + savingsMonthly - homeCosts,
    inflationFactor,
  };
}
export function citySpending(p: HouseholdProfile, s: CityScenario) {
  const funds = incomeAtMove(p, s);
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

/** Increase the current allowances proportionally to use the available income.
 * Keep contingency as a percentage and annual travel as an annual amount.
 * This is an allocation, never a claim that city prices rose with income.
 */
export function allocateSurplus(p: HouseholdProfile, s: CityScenario): CityScenario | null {
  const current = citySpending(p, s);
  if (!current || current.total <= 0 || current.remaining <= 0.01) return null;
  const multiplier = current.available / current.total;
  const budget = { ...s.budget };
  for (const key of Object.keys(budget) as (keyof typeof budget)[]) {
    if (key !== "contingencyPct") budget[key] *= multiplier;
  }
  const next = { ...s, budget };
  return scenarioSchema.safeParse(next).success ? next : null;
}
