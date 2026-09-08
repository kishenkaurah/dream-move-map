import { describe, test, expect, afterEach } from "bun:test";
import { runProjection, monthlyBudgetUsd } from "../src/lib/planner/engine";
import {
  defaultProfile,
  newScenario,
  makePlan,
  importPlanJson,
  exportPlanJson,
  savePlan,
} from "../src/lib/planner/storage";
import {
  profileFromQuiz,
  changeProfileCurrency,
  quizShortlist,
} from "../src/lib/planner/quiz-bridge";
import { fxStressMultiplier } from "../src/lib/planner/fx";
import { DEFAULT_ANSWERS } from "../src/data/questions";
import type { HouseholdProfile, CityScenario } from "../src/lib/planner/types";

const profile = (patch: Partial<HouseholdProfile> = {}): HouseholdProfile => ({
  ...defaultProfile(),
  currency: "USD",
  usdRate: 1,
  currentAge: 60,
  moveAge: 60,
  accessibleFunds: 12000,
  retirementFunds: 0,
  monthlyIncomeNow: 1000,
  returnRateAnnual: 0,
  withdrawalRateAnnual: 0,
  inflationAnnual: 0,
  horizonYears: 2,
  confirmedByUser: true,
  ...patch,
});
const scenario = (patch: Partial<CityScenario> = {}): CityScenario => ({
  ...newScenario("chiang_mai", "solo"),
  budget: {
    housing: 2000,
    groceriesDining: 0,
    utilities: 0,
    transport: 0,
    healthcare: 0,
    leisure: 0,
    annualReturnTravel: 0,
    otherAdmin: 0,
    contingencyPct: 0,
  },
  visaFundsReserve: 0,
  ...patch,
});
const run = (p: Partial<HouseholdProfile> = {}, s: Partial<CityScenario> = {}, rate = 1) =>
  runProjection({ profile: profile(p), scenario: scenario(s), usdRate: rate });

describe("retirement cashflow", () => {
  test("known burn rate records the first expense that cannot be funded", () => {
    const r = run();
    expect(r.errors).toEqual([]);
    expect(r.monthlyGapAtMove).toBe(1000);
    expect(r.firstShortfallAge).toBe(61);
    expect(r.totalUnfunded).toBe(12000);
    expect(r.finalAccessible).toBe(0);
  });
  test("zero income and no funds fails at the move, without NaN", () => {
    const r = run({ monthlyIncomeNow: 0, accessibleFunds: 0 });
    expect(r.firstShortfallAge).toBe(60);
    expect(r.totalUnfunded).toBe(48000);
    expect(r.series.every((s) => Number.isFinite(s.accessible))).toBe(true);
  });
  test("surpluses accumulate once", () => {
    const r = run({ monthlyIncomeNow: 2500 });
    expect(r.firstShortfallAge).toBeNull();
    expect(r.finalAccessible).toBe(24000);
  });
  test("annual flights are divided by twelve once", () => {
    const s = scenario();
    s.budget.annualReturnTravel = 1200;
    expect(monthlyBudgetUsd(s.budget, s)).toBe(2100);
  });
  test("late pension starts at the stated age only after confirmation", () => {
    expect(
      run({ laterIncomeMonthly: 1000, laterIncomeStartAge: 61, laterIncomeConfirmed: true })
        .firstShortfallAge,
    ).toBeNull();
    expect(
      run({ laterIncomeMonthly: 1000, laterIncomeStartAge: 61, laterIncomeConfirmed: false })
        .firstShortfallAge,
    ).toBe(61);
  });
  test("super does not bridge a gap before its access age", () => {
    const p = {
      accessibleFunds: 0,
      retirementFunds: 100000,
      retirementAccessAge: 61,
      retirementAccessConfirmed: true,
    };
    const r = run(p);
    expect(r.firstShortfallAge).toBe(60);
    expect(r.totalUnfunded).toBe(12000);
    expect(r.finalRetirement).toBe(88000);
  });
  test("unconfirmed super remains unavailable", () => {
    expect(
      run({ accessibleFunds: 0, retirementFunds: 100000, retirementAccessAge: 60 }).finalRetirement,
    ).toBe(100000);
  });
  test("unlocked super can fund setup without appearing as income", () => {
    const r = run(
      {
        accessibleFunds: 0,
        retirementFunds: 100000,
        retirementAccessAge: 60,
        retirementAccessConfirmed: true,
      },
      { movingSetupCost: 10000, rentalDeposit: 2000 },
    );
    expect(r.setupShortfall).toBe(0);
    expect(r.finalRetirement).toBe(64000);
    expect(r.monthlyIncomeAtMove).toBe(1000);
    expect(r.series[0]?.restricted).toBe(2000);
  });
  test("future move uses net contributions, not employment income again", () => {
    const r = run({ moveAge: 61, preMoveMonthlySaving: 1000, monthlyIncomeNow: 2000 });
    expect(r.accessibleAtMove).toBe(24000);
    expect(r.finalAccessible).toBe(24000);
  });
  test("sale proceeds and rent are mutually exclusive", () => {
    const p = { netSaleProceeds: 100000, netRentMonthly: 500 };
    expect(run({ ...p, homeProperty: "sell" }).accessibleAtMove).toBe(112000);
    expect(run({ ...p, homeProperty: "sell" }).monthlyIncomeAtMove).toBe(1000);
    expect(run({ ...p, homeProperty: "rent" }).accessibleAtMove).toBe(12000);
    expect(run({ ...p, homeProperty: "rent" }).monthlyIncomeAtMove).toBe(1500);
    expect(run({ ...p, homeProperty: "keep" }).monthlyIncomeAtMove).toBe(1000);
  });
  test("negative rental cashflow is a real expense", () => {
    expect(run({ homeProperty: "rent", netRentMonthly: -500 }).monthlyGapAtMove).toBe(1500);
  });
  test("15 percent less purchasing power applies only to overseas costs", () => {
    const r = run({ ongoingHomeExpensesMonthly: 200 }, { fxStressPct: 15 });
    expect(fxStressMultiplier(15)).toBeCloseTo(1 / 0.85);
    expect(r.monthlySpendingAtMove).toBeCloseTo(2000 / 0.85 + 200, 2);
    expect(r.monthlyIncomeAtMove).toBe(1000);
  });
  test("insufficient setup cash stops the projection without inventing deposits", () => {
    const r = run(
      { accessibleFunds: 1000, monthlyIncomeNow: 10000 },
      { movingSetupCost: 2000, rentalDeposit: 5000 },
    );
    expect(r.setupShortfall).toBe(6000);
    expect(r.firstShortfallAge).toBe(60);
    expect(r.series).toHaveLength(1);
    expect(r.series[0]?.restricted).toBe(0);
  });
  test("funded deposits stay assets, and emergency reserve isn't spent twice", () => {
    const r = run(
      { accessibleFunds: 20000, monthlyIncomeNow: 2000, emergencyReserve: 5000 },
      { movingSetupCost: 2000, rentalDeposit: 3000, visaFundsReserve: 4000 },
    );
    expect(r.accessibleAfterSetup).toBe(11000);
    expect(r.finalAccessible).toBe(11000);
    expect(r.series.at(-1)?.restricted).toBe(7000);
  });
  test("costs inflate before a future move", () => {
    expect(run({ moveAge: 61, inflationAnnual: 0.1 }).monthlySpendingAtMove).toBe(2200);
  });
  test("negative return reduces funds without clamping to positive growth", () => {
    expect(run({ monthlyIncomeNow: 2000, returnRateAnnual: -0.1 }).finalAccessible).toBeCloseTo(
      9720,
      2,
    );
  });
  test("a move outside the horizon and invalid rates are rejected", () => {
    expect(run({ moveAge: 63 }).errors.length).toBeGreaterThan(0);
    expect(run({}, {}, 0).errors.length).toBeGreaterThan(0);
    expect(run({ currentAge: NaN }).series).toEqual([]);
  });
  test("unknown funds are not silently treated as zero", () => {
    expect(run({ retirementFunds: null }).errors.length).toBeGreaterThan(0);
  });
  test("unknown visa reserve stays a visible omitted requirement", () => {
    const r = run({}, { visaFundsReserve: null });
    expect(r.unknowns.some((x) => x.includes("Visa funds are unknown"))).toBe(true);
  });
  test("unsupported destinations cannot become Thailand silently", () => {
    expect(() => newScenario("not-a-city", "solo")).toThrow();
    expect(() => newScenario("da_nang", "solo")).toThrow();
    expect(run({}, { cityId: "da_nang" }).errors.length).toBeGreaterThan(0);
  });
});
describe("saved plans and quiz handoff", () => {
  test("export/import roundtrip preserves profile, rates, and comparison", () => {
    const s = scenario();
    const plan = makePlan({
      profile: profile(),
      scenarios: [{ name: "My plan", scenario: s }],
      draft: s,
    });
    expect(importPlanJson(exportPlanJson(plan))).toEqual(plan);
  });
  test("malformed, stale and dangerous numeric input fails atomically", () => {
    const p = makePlan({ profile: profile(), scenarios: [], draft: scenario() });
    expect(importPlanJson("not json")).toBeNull();
    expect(importPlanJson(JSON.stringify({ ...p, version: 1 }))).toBeNull();
    expect(
      importPlanJson(JSON.stringify({ ...p, profile: { ...p.profile, currency: "FAKE" } })),
    ).toBeNull();
    expect(
      importPlanJson(
        JSON.stringify({
          ...p,
          draft: { ...p.draft, budget: { ...p.draft!.budget, housing: -10 } },
        }),
      ),
    ).toBeNull();
    expect(
      importPlanJson(JSON.stringify({ ...p, draft: { ...p.draft, fxStressPct: 100 } })),
    ).toBeNull();
  });
  test("more than three scenarios and duplicate IDs are rejected", () => {
    const s = scenario();
    expect(() =>
      makePlan({
        profile: profile(),
        scenarios: Array.from({ length: 4 }, () => ({ name: "x", scenario: s })),
        draft: s,
      }),
    ).toThrow();
    expect(() =>
      makePlan({
        profile: profile(),
        scenarios: [
          { name: "a", scenario: s },
          { name: "b", scenario: s },
        ],
        draft: s,
      }),
    ).toThrow();
  });
  test("quota failure does not return saved success", () => {
    const original = globalThis.window;
    Object.defineProperty(globalThis, "window", {
      value: {
        localStorage: {
          setItem() {
            throw new Error("quota exceeded");
          },
        },
      },
      configurable: true,
    });
    try {
      expect(() => savePlan({ profile: profile(), scenarios: [], draft: null })).toThrow(
        "quota exceeded",
      );
    } finally {
      if (original)
        Object.defineProperty(globalThis, "window", { value: original, configurable: true });
      else delete (globalThis as any).window;
    }
  });
  test("quiz midpoint is converted and remains unconfirmed", () => {
    const p = profileFromQuiz({
      ...DEFAULT_ANSWERS,
      citizenship: "australia_nz",
      income: "1500_2500",
      age: "55_64",
      household: "couple",
    });
    expect(p.currency).toBe("AUD");
    expect(p.monthlyIncomeNow).toBe(3040);
    expect(p.currentAge).toBeNull();
    expect(p.accessibleFunds).toBeNull();
    expect(p.confirmedByUser).toBe(false);
    expect(p.homeCountry).toBe("OTHER");
    expect(p.household).toBe("couple");
  });
  test("currency change converts amounts and can roundtrip", () => {
    const p = profile();
    const aud = changeProfileCurrency(p, "AUD");
    expect(aud.accessibleFunds).toBe(18240);
    expect(changeProfileCurrency(aud, "USD").accessibleFunds).toBe(12000);
  });
  test("quiz shortlist respects regional filter and country diversity", () => {
    const a = {
      ...DEFAULT_ANSWERS,
      citizenship: "australia_nz",
      income: "2500_4000",
      age: "55_64",
      household: "couple",
      climate: "tropical",
      setting: "beach",
      healthcare_importance: "high",
      english: "preferred",
      priorities: ["cost"],
      region_pref: "sea",
    };
    const matches = quizShortlist(a);
    expect(matches).toHaveLength(3);
    expect(new Set(matches.map((m) => m.destination.country)).size).toBe(3);
    expect(matches.some((m) => m.destination.country === "Portugal")).toBe(false);
  });
});

import { citySpending, incomeAtMove, allocateSurplus } from "../src/lib/planner/spending";
import { propertySearch } from "../src/lib/planner/property-search";
describe("income connected to city spending", () => {
  test("matches projection income and deficit with future inflation and stress", () => {
    const p = profile({
      moveAge: 61,
      horizonYears: 4,
      monthlyIncomeNow: 2400,
      homeProperty: "rent",
      netRentMonthly: -100,
      ongoingHomeExpensesMonthly: 200,
      inflationAnnual: 0.03,
      laterIncomeMonthly: 300,
      laterIncomeStartAge: 61,
      laterIncomeConfirmed: true,
      usdRate: 1.52,
    });
    const s = scenario({ fxStressPct: 15, expenseStressPct: 10, lifestyleAdjustPct: 5 });
    const budget = citySpending(p, s)!;
    const result = runProjection({ profile: p, scenario: s, usdRate: p.usdRate });
    expect(budget.income).toBeCloseTo(result.monthlyIncomeAtMove, 2);
    expect(budget.total + budget.homeCosts).toBeCloseTo(result.monthlySpendingAtMove, 2);
    expect(-budget.remaining).toBeCloseTo(result.monthlyGapAtMove, 2);
  });
  test("housing headroom balances income, accounting for annual travel and contingency", () => {
    const p = profile({
      monthlyIncomeNow: 3000,
      ongoingHomeExpensesMonthly: 200,
      moveAge: 61,
      inflationAnnual: 0.03,
    });
    const s = scenario();
    s.budget.annualReturnTravel = 2400;
    s.budget.contingencyPct = 10;
    s.fxStressPct = 20;
    const limit = citySpending(p, s)!.housingLimitToday;
    s.budget.housing = limit / p.usdRate;
    expect(citySpending(p, s)!.remaining).toBeCloseTo(0, 6);
    s.budget.groceriesDining = 100;
    expect(citySpending(p, s)!.housingLimitToday).toBeCloseTo(limit - 100, 6);
  });
  test("unknown income is not zero and unconfirmed future income is excluded", () => {
    expect(incomeAtMove(profile({ monthlyIncomeNow: null }))).toBeNull();
    expect(citySpending(profile(), scenario({ fxStressPct: NaN }))).toBeNull();
    expect(
      incomeAtMove(
        profile({ laterIncomeMonthly: 2000, laterIncomeStartAge: 60, laterIncomeConfirmed: false }),
      )!.income,
    ).toBe(1000);
    expect(
      incomeAtMove(
        profile({ laterIncomeMonthly: 2000, laterIncomeStartAge: 61, laterIncomeConfirmed: true }),
      )!.income,
    ).toBe(1000);
  });
  test("zero income and negative rental cashflow show the full shortfall", () => {
    const p = profile({ monthlyIncomeNow: 0, homeProperty: "rent", netRentMonthly: -100 });
    const b = citySpending(p, scenario())!;
    expect(b.remaining).toBe(-2100);
    expect(b.housingLimitToday).toBe(-100);
  });
});

describe("surplus allocation and rental searches", () => {
  test("allocates all available income while preserving proportions, buffers and move costs", () => {
    const p = profile({
      monthlyIncomeNow: 7000,
      ongoingHomeExpensesMonthly: 200,
      moveAge: 61,
      inflationAnnual: 0.03,
      usdRate: 1.52,
    });
    const s = scenario({
      fxStressPct: 15,
      expenseStressPct: 10,
      lifestyleAdjustPct: 5,
      movingSetupCost: 2000,
      rentalDeposit: 1000,
      visaFundsReserve: 5000,
    });
    s.budget.groceriesDining = 400;
    s.budget.annualReturnTravel = 2400;
    s.budget.contingencyPct = 10;
    const original = structuredClone(s);
    const allocated = allocateSurplus(p, s)!;
    expect(allocated).not.toBeNull();
    expect(citySpending(p, allocated)!.remaining).toBeCloseTo(0, 6);
    expect(allocated.budget.housing / allocated.budget.groceriesDining).toBeCloseTo(5, 8);
    expect(allocated.budget.annualReturnTravel / allocated.budget.housing).toBeCloseTo(1.2, 8);
    expect(
      citySpending(p, allocated)!.lines.find((x) => x.key === "annualReturnTravel")!.amount /
        citySpending(p, allocated)!.lines.find((x) => x.key === "housing")!.amount,
    ).toBeCloseTo(0.1, 8);
    expect(allocated.budget.utilities).toBe(0);
    expect(allocated.budget.contingencyPct).toBe(10);
    expect(allocated.movingSetupCost).toBe(2000);
    expect(allocated.rentalDeposit).toBe(1000);
    expect(allocated.visaFundsReserve).toBe(5000);
    expect(s).toEqual(original);
    expect(allocateSurplus(p, allocated)).toBeNull();
  });
  test("does not invent an allocation for a deficit, empty budget or invalid income", () => {
    expect(allocateSurplus(profile(), scenario())).toBeNull();
    expect(allocateSurplus(profile({ monthlyIncomeNow: null }), scenario())).toBeNull();
    const s = scenario();
    s.budget.housing = 0;
    expect(allocateSurplus(profile(), s)).toBeNull();
  });
  test("rental links use a local-currency ceiling and area-only fallback", () => {
    const bangkok = propertySearch("bangkok", 1000, 33.456)!;
    expect(bangkok.maximum).toBe(33456);
    expect(bangkok.currency).toBe("THB");
    expect(new URL(bangkok.url).searchParams.get("maxPrice")).toBe("33456");
    expect(new URL(bangkok.url).pathname).toContain("in-bangkok-th10");
    expect(new URL(bangkok.browseUrl).search).toBe("");
    for (const id of [
      "penang",
      "kuala_lumpur",
      "kuching",
      "lisbon",
      "porto",
      "algarve",
      "funchal",
    ]) {
      const search = propertySearch(id, 1000)!;
      expect(search.priceFilter).toBe(false);
      expect(new URL(search.url).search).toBe("");
    }
  });
  test("invalid or unsupported housing searches do not generate links", () => {
    expect(propertySearch("not-a-city", 1000)).toBeNull();
    expect(propertySearch("bangkok", 0)).toBeNull();
    expect(propertySearch("bangkok", -1000)).toBeNull();
    expect(propertySearch("bangkok", NaN)).toBeNull();
    expect(propertySearch("bangkok", 1000, NaN)).toBeNull();
    expect(propertySearch("bangkok", 1000, 0)).toBeNull();
  });
});

describe("savings as spending power", () => {
  test("1.8m at 4% adds 6000 monthly to recurring income", () => {
    const p = profile({ accessibleFunds: 1800000, withdrawalRateAnnual: 0.04 });
    const summary = incomeAtMove(p)!;
    expect(summary.savingsMonthly).toBe(6000);
    expect(summary.available).toBe(7000);
    expect(summary.income).toBe(1000);
  });
  test("future move compounds savings and contributions before calculating the allowance", () => {
    const p = profile({
      currentAge: 38,
      moveAge: 45,
      horizonYears: 60,
      accessibleFunds: 1800000,
      withdrawalRateAnnual: 0.04,
      returnRateAnnual: 0.07,
      preMoveMonthlySaving: 500,
    });
    const s = scenario();
    const summary = incomeAtMove(p, s)!;
    const result = runProjection({ profile: p, scenario: s, usdRate: 1 });
    expect(summary.savings!.todayMonthly).toBe(6000);
    expect(summary.savings!.base).toBeCloseTo(result.accessibleAtMove, 2);
    expect(summary.savingsMonthly).toBeCloseTo((result.accessibleAtMove * 0.04) / 12, 2);
    expect(summary.savingsMonthly).toBeGreaterThan(6000);
  });
  test("allocated withdrawals reduce principal exactly once, unused allowance stays invested", () => {
    const p = profile({ accessibleFunds: 1800000, withdrawalRateAnnual: 0.04, horizonYears: 1 });
    const s = allocateSurplus(p, scenario())!;
    const result = runProjection({ profile: p, scenario: s, usdRate: 1 });
    expect(citySpending(p, s)!.remaining).toBeCloseTo(0, 6);
    expect(result.monthlySpendingPowerAtMove).toBe(7000);
    expect(result.monthlyGapAtMove).toBe(6000);
    expect(result.finalAccessible).toBe(1728000);
    const lowerSpending = runProjection({ profile: p, scenario: scenario(), usdRate: 1 });
    expect(lowerSpending.finalAccessible).toBe(1788000);
  });
  test("locked super stays excluded and setup/deposits reduce the base without doubling sales", () => {
    const p = profile({
      accessibleFunds: 100000,
      retirementFunds: 300000,
      retirementAccessAge: 61,
      retirementAccessConfirmed: true,
      homeProperty: "sell",
      netSaleProceeds: 200000,
      withdrawalRateAnnual: 0.04,
    });
    const s = scenario({ movingSetupCost: 10000, rentalDeposit: 20000, visaFundsReserve: 30000 });
    expect(incomeAtMove(p, s)!.savings!.base).toBe(240000);
    expect(incomeAtMove({ ...p, retirementAccessAge: 60 }, s)!.savings!.base).toBe(540000);
    expect(
      incomeAtMove({ ...p, retirementAccessAge: 60, retirementAccessConfirmed: false }, s)!.savings!
        .base,
    ).toBe(240000);
  });
  test("legacy saved plans receive 4% without losing amounts or existing return assumptions", () => {
    const plan = makePlan({
      profile: profile({ accessibleFunds: 1800000, returnRateAnnual: 0.03 }),
      scenarios: [],
      draft: scenario(),
    });
    const raw = JSON.parse(exportPlanJson(plan));
    delete raw.profile.withdrawalRateAnnual;
    const imported = importPlanJson(JSON.stringify(raw))!;
    expect(imported.profile.withdrawalRateAnnual).toBe(0.04);
    expect(imported.profile.accessibleFunds).toBe(1800000);
    expect(imported.profile.returnRateAnnual).toBe(0.03);
    raw.profile.withdrawalRateAnnual = -0.04;
    expect(importPlanJson(JSON.stringify(raw))).toBeNull();
  });
  test("unknown savings and invalid rates do not create a withdrawal allowance", () => {
    expect(
      incomeAtMove(profile({ accessibleFunds: null, withdrawalRateAnnual: 0.04 }))!.savings,
    ).toBeNull();
    expect(incomeAtMove(profile({ withdrawalRateAnnual: NaN }))!.savings).toBeNull();
    expect(
      incomeAtMove(profile({ accessibleFunds: 0, withdrawalRateAnnual: 0.04 }))!.savingsMonthly,
    ).toBe(0);
  });
});

import { autoAllocateBudget } from "../src/lib/planner/spending";
describe("automatic spending allocation", () => {
  test("allocates spending power including annual travel and responds to withdrawal changes", () => {
    const p = profile({ accessibleFunds: 1800000, withdrawalRateAnnual: 0.04 });
    const s = autoAllocateBudget(p, scenario());
    expect(s.budget.annualReturnTravel).toBeGreaterThan(0);
    expect(citySpending(p, s)!.total).toBeCloseTo(7000, 6);
    const reduced = autoAllocateBudget({ ...p, withdrawalRateAnnual: 0.02 }, s);
    expect(citySpending({ ...p, withdrawalRateAnnual: 0.02 }, reduced)!.total).toBeCloseTo(4000, 6);
    expect(reduced.budget.annualReturnTravel / s.budget.annualReturnTravel).toBeCloseTo(4 / 7, 6);
    expect(autoAllocateBudget(p, s)).toBe(s);
  });
  test("manual edits, including zero travel, are preserved", () => {
    const s = scenario({ autoAllocate: false });
    const p = profile({ accessibleFunds: 1800000, withdrawalRateAnnual: 0.04 });
    expect(autoAllocateBudget(p, s)).toBe(s);
    expect(
      autoAllocateBudget({ ...p, withdrawalRateAnnual: 0.08 }, s).budget.annualReturnTravel,
    ).toBe(0);
    expect(
      autoAllocateBudget(p, { ...s, autoAllocate: true }).budget.annualReturnTravel,
    ).toBeGreaterThan(0);
  });
  test("annual travel is counted once and setup funds stay separate", () => {
    const p = profile({ accessibleFunds: 1800000, withdrawalRateAnnual: 0.04 });
    const s = autoAllocateBudget(p, scenario({ movingSetupCost: 10000, rentalDeposit: 2000 }));
    const spending = citySpending(p, s)!;
    expect(spending.lines.find((x) => x.key === "annualReturnTravel")!.amount).toBeCloseTo(
      s.budget.annualReturnTravel / 12,
      6,
    );
    expect(spending.total).toBeCloseTo(spending.available, 6);
    expect(s.movingSetupCost).toBe(10000);
    expect(s.rentalDeposit).toBe(2000);
  });
  test("existing plans gain automatic mode without losing their saved profile", () => {
    const plan = makePlan({
      profile: profile({ accessibleFunds: 1800000, withdrawalRateAnnual: 0.04 }),
      scenarios: [],
      draft: scenario(),
    });
    const raw = JSON.parse(exportPlanJson(plan));
    delete raw.draft.autoAllocate;
    const loaded = importPlanJson(JSON.stringify(raw))!;
    expect(loaded.draft!.autoAllocate).toBe(true);
    expect(
      autoAllocateBudget(loaded.profile, loaded.draft!).budget.annualReturnTravel,
    ).toBeGreaterThan(0);
    expect(loaded.profile.accessibleFunds).toBe(1800000);
  });
});
