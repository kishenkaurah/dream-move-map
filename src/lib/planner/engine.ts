/** Deterministic monthly cashflow. Income and costs occur at the start of each
 * month, then remaining balances grow. Costs are today's prices, inflated from
 * today. Income stays nominally fixed. Unknown entitlements are never awarded.
 * A first unfunded expense is recorded permanently; later income cannot erase it.
 */
import type { BudgetItems, CityScenario, HouseholdProfile } from "./types";
import { savingsAtMove } from "./spending";
import { fxStressMultiplier } from "./fx";
import { profileSchema, scenarioSchema } from "./storage";

export interface EngineInput {
  profile: HouseholdProfile;
  scenario: CityScenario;
  usdRate: number;
}
export interface YearPoint {
  age: number;
  monthIndex: number;
  accessible: number;
  retirement: number;
  restricted: number;
  monthlyIncome: number;
  monthlySpending: number;
  unfunded: number;
}
export interface EngineResult {
  monthlyIncomeAtMove: number;
  monthlySavingsAllowanceAtMove: number;
  monthlySpendingPowerAtMove: number;
  monthlySpendingAtMove: number;
  monthlySurplusAtMove: number;
  monthlyGapAtMove: number;
  setupCost: number;
  restrictedAtMove: number;
  accessibleAtMove: number;
  accessibleAfterSetup: number;
  setupShortfall: number;
  totalUnfunded: number;
  series: YearPoint[];
  firstShortfallAge: number | null;
  belowEmergencyReserveAge: number | null;
  finalAccessible: number;
  finalRetirement: number;
  unknowns: string[];
  errors: string[];
}
const round2 = (n: number) => Math.round(n * 100) / 100;

export function monthlyBudgetUsd(b: BudgetItems, s: CityScenario): number {
  const base =
    b.housing +
    b.groceriesDining +
    b.utilities +
    b.transport +
    b.healthcare +
    b.leisure +
    b.otherAdmin +
    b.annualReturnTravel / 12;
  return (
    base *
    (1 + b.contingencyPct / 100) *
    (1 + s.lifestyleAdjustPct / 100) *
    (1 + s.expenseStressPct / 100)
  );
}
export function validateProfile(p: HouseholdProfile): string[] {
  const check = profileSchema.safeParse(p);
  if (!check.success) return check.error.issues.map((i) => `${i.path.join(" ")}: ${i.message}`);
  const errors: string[] = [];
  for (const [label, value] of [
    ["your current age", p.currentAge],
    ["your planned move age", p.moveAge],
    ["your accessible savings", p.accessibleFunds],
    ["your retirement fund balance (enter 0 if none)", p.retirementFunds],
    ["your after-tax monthly income (enter 0 if none)", p.monthlyIncomeNow],
  ] as const) {
    if (value === null) errors.push(`Enter ${label}.`);
  }
  if (p.currentAge !== null && p.moveAge !== null) {
    if (p.moveAge < p.currentAge)
      errors.push("Your move age cannot be earlier than your current age.");
    if (p.moveAge >= p.currentAge + p.horizonYears)
      errors.push("Extend the projection horizon beyond your move age.");
  }
  if ((p.retirementFunds ?? 0) > 0 && p.retirementAccessConfirmed && p.retirementAccessAge === null)
    errors.push("Enter the confirmed retirement fund access age.");
  if (p.laterIncomeMonthly > 0 && p.laterIncomeConfirmed && p.laterIncomeStartAge === null)
    errors.push("Enter the confirmed later-income start age.");
  return errors;
}
const emptyResult = (errors: string[]): EngineResult => ({
  monthlyIncomeAtMove: 0,
  monthlySavingsAllowanceAtMove: 0,
  monthlySpendingPowerAtMove: 0,
  monthlySpendingAtMove: 0,
  monthlySurplusAtMove: 0,
  monthlyGapAtMove: 0,
  setupCost: 0,
  restrictedAtMove: 0,
  accessibleAtMove: 0,
  accessibleAfterSetup: 0,
  setupShortfall: 0,
  totalUnfunded: 0,
  series: [],
  firstShortfallAge: null,
  belowEmergencyReserveAge: null,
  finalAccessible: 0,
  finalRetirement: 0,
  unknowns: [],
  errors,
});

export function runProjection({ profile: p, scenario: s, usdRate }: EngineInput): EngineResult {
  const errors = validateProfile(p);
  const validScenario = scenarioSchema.safeParse(s);
  if (!validScenario.success)
    errors.push(...validScenario.error.issues.map((i) => `${i.path.join(" ")}: ${i.message}`));
  if (!Number.isFinite(usdRate) || usdRate < 0.0001 || usdRate > 10000)
    errors.push("Enter a valid exchange rate.");
  if (errors.length) return emptyResult(errors);
  const result = emptyResult([]);
  const { unknowns } = result;
  if (!p.confirmedByUser)
    unknowns.push(
      p.prefilledFromQuiz
        ? "Income was estimated from your quiz bracket. Confirm your actual figures."
        : "Review and confirm your financial profile.",
    );
  if (
    (p.retirementFunds ?? 0) > 0 &&
    (!p.retirementAccessConfirmed || p.retirementAccessAge === null)
  )
    unknowns.push(
      "Retirement funds are excluded from withdrawals until you confirm their access age.",
    );
  if (p.laterIncomeMonthly > 0 && !p.laterIncomeConfirmed)
    unknowns.push(
      "Unconfirmed later income is excluded. Check its amount, start age and overseas eligibility.",
    );
  if (s.visaFundsReserve === null)
    unknowns.push(
      "Visa funds are unknown and excluded from the cash requirement. The move may require more money.",
    );
  if (!s.budget.annualReturnTravel)
    unknowns.push("Flights home are set to zero. Add a quote if you plan to travel.");
  if (!s.movingSetupCost)
    unknowns.push("Moving and setup expenses are set to zero. Replace this with your estimate.");
  if (!s.rentalDeposit)
    unknowns.push("Rental deposit is set to zero. Check your accommodation requirements.");
  unknowns.push(
    "Healthcare and housing start as model allowances. Replace them with quotes for your situation.",
  );

  const ageNow = p.currentAge!;
  const moveMonths = Math.round((p.moveAge! - ageNow) * 12);
  const moveAge = ageNow + moveMonths / 12;
  const months = p.horizonYears * 12;
  const growth = Math.pow(1 + p.returnRateAnnual, 1 / 12);
  const inflation = Math.pow(1 + p.inflationAnnual, 1 / 12);
  const fx = fxStressMultiplier(s.fxStressPct);
  let accessible = p.accessibleFunds!;
  let retirement = p.retirementFunds ?? 0;
  let overseas = monthlyBudgetUsd(s.budget, s) * usdRate * fx;
  let homeCosts = p.ongoingHomeExpensesMonthly;
  let restricted = 0;
  let unfunded = 0;
  const canAccessRetirement = (age: number) =>
    p.retirementAccessConfirmed &&
    p.retirementAccessAge !== null &&
    age + 1e-9 >= p.retirementAccessAge;
  const incomeAt = (age: number) =>
    p.monthlyIncomeNow! +
    (p.homeProperty === "rent" ? p.netRentMonthly : 0) +
    (p.laterIncomeConfirmed && p.laterIncomeStartAge !== null && age + 1e-9 >= p.laterIncomeStartAge
      ? p.laterIncomeMonthly
      : 0);
  const push = (m: number, income: number, spending: number) =>
    result.series.push({
      age: round2(ageNow + m / 12),
      monthIndex: m,
      accessible: round2(accessible),
      retirement: round2(retirement),
      restricted: round2(restricted),
      monthlyIncome: round2(income),
      monthlySpending: round2(spending),
      unfunded: round2(unfunded),
    });
  /** Returns unmet need; withdrawing is never counted as an income stream. */
  const withdraw = (amount: number, age: number) => {
    const fromCash = Math.min(accessible, amount);
    accessible -= fromCash;
    let remaining = amount - fromCash;
    if (remaining > 0 && canAccessRetirement(age)) {
      const fromRetirement = Math.min(retirement, remaining);
      retirement -= fromRetirement;
      remaining -= fromRetirement;
    }
    return remaining < 1e-7 ? 0 : remaining;
  };
  for (let m = 0; m < moveMonths; m++) {
    // Pre-move contribution is net of ALL home income/spending; never add income again.
    if (m % 12 === 0) push(m, 0, 0);
    accessible = (accessible + p.preMoveMonthlySaving) * growth;
    retirement *= growth;
    overseas *= inflation;
    homeCosts *= inflation;
  }
  if (p.homeProperty === "sell") accessible += p.netSaleProceeds;
  result.accessibleAtMove = round2(accessible);
  result.setupCost = round2(s.movingSetupCost * usdRate * fx);
  result.restrictedAtMove = round2((s.rentalDeposit + (s.visaFundsReserve ?? 0)) * usdRate * fx);
  result.monthlyIncomeAtMove = round2(incomeAt(moveAge));
  result.monthlySavingsAllowanceAtMove = round2(savingsAtMove({ ...p, usdRate }, s)?.monthly ?? 0);
  result.monthlySpendingPowerAtMove = round2(
    incomeAt(moveAge) + result.monthlySavingsAllowanceAtMove,
  );
  // The allowance is a spending guide, never a deposit of new money. The loop
  // below deducts actual spending minus external income from balances exactly once.
  result.monthlySpendingAtMove = round2(overseas + homeCosts);
  const net = incomeAt(moveAge) - overseas - homeCosts;
  result.monthlySurplusAtMove = round2(Math.max(net, 0));
  result.monthlyGapAtMove = round2(Math.max(-net, 0));
  // Don't manufacture a restricted asset if the move cannot be funded.
  const available = accessible + (canAccessRetirement(moveAge) ? retirement : 0);
  const need = result.setupCost + result.restrictedAtMove;
  if (available + 1e-7 < need) {
    result.setupShortfall = round2(need - available);
    result.totalUnfunded = result.setupShortfall;
    result.firstShortfallAge = moveAge;
    result.accessibleAfterSetup = 0;
    result.finalAccessible = round2(accessible);
    result.finalRetirement = round2(retirement);
    unknowns.push(
      "The move cannot be funded under these inputs. The projection stops before setup costs and deposits are paid.",
    );
    push(moveMonths, incomeAt(moveAge), overseas + homeCosts);
    return result;
  }
  withdraw(need, moveAge);
  restricted = result.restrictedAtMove;
  result.accessibleAfterSetup = round2(accessible);
  if (accessible < p.emergencyReserve) result.belowEmergencyReserveAge = moveAge;
  for (let m = moveMonths; m < months; m++) {
    const age = ageNow + m / 12;
    const income = incomeAt(age);
    const spending = overseas + homeCosts;
    if (m % 12 === 0 || m === moveMonths) push(m, income, spending);
    const gap = spending - income;
    if (gap > 0) {
      const missing = withdraw(gap, age);
      unfunded += missing;
      if (missing > 0 && result.firstShortfallAge === null) result.firstShortfallAge = round2(age);
    } else accessible -= gap;
    if (accessible < p.emergencyReserve && result.belowEmergencyReserveAge === null)
      result.belowEmergencyReserveAge = round2(age);
    accessible *= growth;
    retirement *= growth;
    overseas *= inflation;
    homeCosts *= inflation;
  }
  push(months, incomeAt(ageNow + p.horizonYears), overseas + homeCosts);
  result.totalUnfunded = round2(unfunded);
  result.finalAccessible = round2(accessible);
  result.finalRetirement = round2(retirement);
  return result;
}
