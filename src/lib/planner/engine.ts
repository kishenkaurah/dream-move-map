/**
 * DETERMINISTIC AFFORDABILITY ENGINE.
 *
 * A plain month-by-month simulation. No AI, no randomness, no probability of
 * success, and no statement that anything is "safe". It reports what the
 * stated assumptions imply, and lists what is still unknown.
 *
 * Timing convention for each simulated month:
 *   1. income is received
 *   2. spending is paid
 *   3. the surplus is added / the deficit is drawn down
 *   4. balances grow by one month of the nominal return
 *   5. living costs are inflated by one month
 */
import type { BudgetItems, CityScenario, HouseholdProfile } from "./types";
import { fxStressMultiplier } from "./fx";

export interface EngineInput {
  profile: HouseholdProfile;
  scenario: CityScenario;
  /** USD → home currency. Indicative; the user can override it. */
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
}

export interface EngineResult {
  /** Monthly figures at the moment of the move, in home currency. */
  monthlyIncomeAtMove: number;
  monthlySpendingAtMove: number;
  monthlySurplusAtMove: number;
  /** Positive when spending exceeds income: extra savings needed per month. */
  monthlyGapAtMove: number;

  /** One-off spend that is genuinely consumed (home currency). */
  setupCost: number;
  /** Refundable deposit + confirmed visa funds: still yours, but not spendable. */
  restrictedAtMove: number;

  accessibleAtMove: number;
  accessibleAfterSetup: number;

  series: YearPoint[];
  /** Age at which accessible + available retirement funds first hit zero. */
  firstShortfallAge: number | null;
  belowEmergencyReserveAge: number | null;
  finalAccessible: number;
  finalRetirement: number;

  /** Things the model could not know. Shown to the user, never hidden. */
  unknowns: string[];
  errors: string[];
}

const MONTHS = 12;

const isBad = (n: number | null | undefined): boolean =>
  n === null || n === undefined || !Number.isFinite(n);

/** Monthly overseas cost in USD before FX/inflation, after lifestyle + stress. */
export function monthlyBudgetUsd(budget: BudgetItems, scenario: CityScenario): number {
  const base =
    budget.housing +
    budget.groceriesDining +
    budget.utilities +
    budget.transport +
    budget.healthcare +
    budget.leisure +
    budget.otherAdmin +
    budget.annualReturnTravel / MONTHS; // divided by 12 exactly once
  const withContingency = base * (1 + clamp(budget.contingencyPct, 0, 100) / 100);
  const lifestyle = 1 + clamp(scenario.lifestyleAdjustPct, -50, 100) / 100;
  const stress = 1 + clamp(scenario.expenseStressPct, 0, 100) / 100;
  return withContingency * lifestyle * stress;
}

function clamp(n: number, min: number, max: number) {
  if (!Number.isFinite(n)) return min;
  return Math.min(Math.max(n, min), max);
}

function monthlyRate(annual: number): number {
  const r = clamp(annual, -0.9, 1) ;
  return Math.pow(1 + r, 1 / MONTHS) - 1;
}

export function validateProfile(p: HouseholdProfile): string[] {
  const errors: string[] = [];
  const required: [string, number | null][] = [
    ["your current age", p.currentAge],
    ["the age you plan to move", p.moveAge],
    ["your accessible cash and investments", p.accessibleFunds],
    ["your after-tax monthly income", p.monthlyIncomeNow],
  ];
  for (const [label, value] of required) {
    if (isBad(value)) errors.push(`Enter ${label} before we can project anything.`);
  }
  const numbers: [string, number][] = [
    ["Accessible funds", p.accessibleFunds ?? 0],
    ["Retirement funds", p.retirementFunds ?? 0],
    ["Monthly income", p.monthlyIncomeNow ?? 0],
    ["Later income", p.laterIncomeMonthly],
    ["Net rent", p.netRentMonthly],
    ["Net sale proceeds", p.netSaleProceeds],
    ["Pre-move saving", p.preMoveMonthlySaving],
    ["Ongoing home expenses", p.ongoingHomeExpensesMonthly],
    ["Emergency reserve", p.emergencyReserve],
  ];
  for (const [label, value] of numbers) {
    if (!Number.isFinite(value)) errors.push(`${label} must be a number.`);
    else if (value < 0) errors.push(`${label} cannot be negative.`);
  }
  if (!isBad(p.currentAge) && !isBad(p.moveAge) && (p.moveAge as number) < (p.currentAge as number)) {
    errors.push("The age you plan to move cannot be before your current age.");
  }
  return errors;
}

export function runProjection(input: EngineInput): EngineResult {
  const { profile: p, scenario: s } = input;
  const errors = validateProfile(p);
  const unknowns: string[] = [];

  const usdRate = Number.isFinite(input.usdRate) && input.usdRate > 0 ? input.usdRate : 1;
  const fx = fxStressMultiplier(s.fxStressPct);

  if (errors.length) {
    return emptyResult(errors);
  }

  const currentAge = p.currentAge as number;
  const moveAge = Math.max(p.moveAge as number, currentAge);
  const horizonYears = clamp(p.horizonYears, 1, 60);

  // ---------------------------------------------------------------- unknowns
  if (p.prefilledFromQuiz && !p.confirmedByUser) {
    unknowns.push(
      "Some figures were estimated from your quiz answers. Confirm them — they are brackets, not your real numbers.",
    );
  }
  if ((p.retirementFunds ?? 0) > 0 && !p.retirementAccessConfirmed) {
    unknowns.push("You have not confirmed the age your retirement funds become accessible.");
  }
  if (p.laterIncomeMonthly > 0 && !p.laterIncomeConfirmed) {
    unknowns.push("Later income is an estimate you have not confirmed. It may not be payable overseas.");
  }
  if (s.visaFundsReserve === null) {
    unknowns.push("Visa funds to set aside are unknown — we have not assumed any figure.");
  }
  if (s.budget.annualReturnTravel === 0) {
    unknowns.push("Return-home travel is set to zero. Add your own flight estimate if you plan to visit.");
  }
  if (p.homeProperty === "rent" && p.netRentMonthly === 0) {
    unknowns.push("You chose to rent out your home but entered no net rental cashflow.");
  }
  if (p.homeProperty === "sell" && p.netSaleProceeds === 0) {
    unknowns.push("You chose to sell your home but entered no net sale proceeds.");
  }

  // -------------------------------------------------------------- money setup
  const rMonthly = monthlyRate(p.returnRateAnnual);
  const iMonthly = monthlyRate(p.inflationAnnual);

  let accessible = p.accessibleFunds as number;
  let retirement = p.retirementFunds ?? 0;
  let restricted = 0;

  const preMoveMonths = Math.round((moveAge - currentAge) * MONTHS);
  const totalMonths = Math.round(horizonYears * MONTHS);

  // Living costs inflate from today; overseas costs are converted and stressed.
  let overseasMonthlyHome = monthlyBudgetUsd(s.budget, s) * usdRate * fx;
  let homeExpensesMonthly = p.ongoingHomeExpensesMonthly;

  const series: YearPoint[] = [];
  let firstShortfallAge: number | null = null;
  let belowReserveAge: number | null = null;

  const push = (monthIndex: number, income: number, spending: number) => {
    series.push({
      age: currentAge + monthIndex / MONTHS,
      monthIndex,
      accessible: round2(accessible),
      retirement: round2(retirement),
      restricted: round2(restricted),
      monthlyIncome: round2(income),
      monthlySpending: round2(spending),
    });
  };

  // ------------------------------------------------------- phase A: pre-move
  for (let m = 0; m < Math.min(preMoveMonths, totalMonths); m++) {
    if (m % MONTHS === 0) push(m, p.monthlyIncomeNow as number, homeExpensesMonthly);
    accessible += p.preMoveMonthlySaving;
    accessible *= 1 + rMonthly;
    retirement *= 1 + rMonthly;
    overseasMonthlyHome *= 1 + iMonthly;
    homeExpensesMonthly *= 1 + iMonthly;
  }

  // ------------------------------------------------------------ the move day
  const accessibleAtMove = accessible;
  if (p.homeProperty === "sell") accessible += p.netSaleProceeds;

  const setupCost = s.movingSetupCost * usdRate * fx;
  const restrictedAtMove = (s.rentalDeposit + (s.visaFundsReserve ?? 0)) * usdRate * fx;

  accessible -= setupCost; // genuinely spent
  accessible -= restrictedAtMove; // still yours, but locked up
  restricted += restrictedAtMove;

  if (accessible < 0) {
    unknowns.push(
      "Your accessible funds do not cover the one-off setup costs and money that must be set aside.",
    );
    accessible = 0;
  }
  const accessibleAfterSetup = accessible;

  const incomeAt = (age: number) => {
    let income = p.monthlyIncomeNow as number;
    if (
      p.laterIncomeMonthly > 0 &&
      !isBad(p.laterIncomeStartAge) &&
      age >= (p.laterIncomeStartAge as number)
    ) {
      income += p.laterIncomeMonthly;
    }
    if (p.homeProperty === "rent") income += p.netRentMonthly;
    return income;
  };

  const monthlyIncomeAtMove = incomeAt(moveAge);
  const monthlySpendingAtMove = overseasMonthlyHome + homeExpensesMonthly;
  const surplusAtMove = monthlyIncomeAtMove - monthlySpendingAtMove;

  // ----------------------------------------------------- phase B: after move
  for (let m = preMoveMonths; m < totalMonths; m++) {
    const age = currentAge + m / MONTHS;
    const income = incomeAt(age);
    const spending = overseasMonthlyHome + homeExpensesMonthly;
    if (m % MONTHS === 0 || m === preMoveMonths) push(m, income, spending);

    let net = income - spending;
    if (net >= 0) {
      accessible += net;
    } else {
      let shortfall = -net;
      const fromAccessible = Math.min(accessible, shortfall);
      accessible -= fromAccessible;
      shortfall -= fromAccessible; // never drawn twice
      const retirementUnlocked =
        !isBad(p.retirementAccessAge) && age >= (p.retirementAccessAge as number);
      if (shortfall > 0 && retirementUnlocked) {
        const fromRetirement = Math.min(retirement, shortfall);
        retirement -= fromRetirement;
        shortfall -= fromRetirement;
      }
      if (shortfall > 0 && firstShortfallAge === null) {
        firstShortfallAge = Math.round(age * 10) / 10;
      }
    }

    if (belowReserveAge === null && p.emergencyReserve > 0 && accessible < p.emergencyReserve) {
      belowReserveAge = Math.round(age * 10) / 10;
    }

    accessible *= 1 + rMonthly;
    retirement *= 1 + rMonthly;
    restricted *= 1; // held flat: a deposit is not an investment
    overseasMonthlyHome *= 1 + iMonthly;
    homeExpensesMonthly *= 1 + iMonthly;

    if (!Number.isFinite(accessible)) accessible = 0;
    if (!Number.isFinite(retirement)) retirement = 0;
  }

  push(totalMonths, incomeAt(currentAge + horizonYears), overseasMonthlyHome + homeExpensesMonthly);

  return {
    monthlyIncomeAtMove: round2(monthlyIncomeAtMove),
    monthlySpendingAtMove: round2(monthlySpendingAtMove),
    monthlySurplusAtMove: round2(Math.max(surplusAtMove, 0)),
    monthlyGapAtMove: round2(Math.max(-surplusAtMove, 0)),
    setupCost: round2(setupCost),
    restrictedAtMove: round2(restrictedAtMove),
    accessibleAtMove: round2(accessibleAtMove),
    accessibleAfterSetup: round2(accessibleAfterSetup),
    series,
    firstShortfallAge,
    belowEmergencyReserveAge: belowReserveAge,
    finalAccessible: round2(accessible),
    finalRetirement: round2(retirement),
    unknowns,
    errors,
  };
}

function round2(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100) / 100;
}

function emptyResult(errors: string[]): EngineResult {
  return {
    monthlyIncomeAtMove: 0,
    monthlySpendingAtMove: 0,
    monthlySurplusAtMove: 0,
    monthlyGapAtMove: 0,
    setupCost: 0,
    restrictedAtMove: 0,
    accessibleAtMove: 0,
    accessibleAfterSetup: 0,
    series: [],
    firstShortfallAge: null,
    belowEmergencyReserveAge: null,
    finalAccessible: 0,
    finalRetirement: 0,
    unknowns: [],
    errors,
  };
}
