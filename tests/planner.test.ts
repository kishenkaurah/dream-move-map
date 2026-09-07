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
