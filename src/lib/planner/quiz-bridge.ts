import type { Answers } from "@/data/questions";
import { displayCurrency, rankDestinations, topMatches } from "@/lib/scoring";
import { regionForCountry, regionFromAnswer } from "@/data/regions";
import { defaultProfile } from "./storage";
import { usdRateFor } from "./fx";
import type { HouseholdProfile } from "./types";

/** Bracket midpoints are suggestions only. Age bands never become an exact age. */
export function profileFromQuiz(answers: Answers): HouseholdProfile {
  const currency = displayCurrency(answers);
  const rate = usdRateFor(currency);
  const income: Record<string, number> = {
    under_1500: 1200,
    "1500_2500": 2000,
    "2500_4000": 3200,
    "4000_6000": 5000,
    over_6000: 7500,
  };
  const value = typeof answers["income"] === "string" ? income[answers["income"]] : undefined;
  return {
    ...defaultProfile(),
    homeCountry: "OTHER",
    currency,
    usdRate: rate,
    household:
      answers["household"] === "couple"
        ? "couple"
        : String(answers["household"]).endsWith("kids")
          ? "family"
          : "solo",
    monthlyIncomeNow: value === undefined ? null : value * rate,
    prefilledFromQuiz: value !== undefined,
    confirmedByUser: false,
  };
}
export function quizShortlist(answers: Answers) {
  const region = regionFromAnswer(
    typeof answers["region_pref"] === "string" ? answers["region_pref"] : undefined,
  );
  const ranked = rankDestinations(answers);
  return topMatches(
    region ? ranked.filter((r) => regionForCountry(r.destination.country) === region) : ranked,
    3,
  );
}

const HOME_MONEY_FIELDS = [
  "accessibleFunds",
  "retirementFunds",
  "monthlyIncomeNow",
  "laterIncomeMonthly",
  "netRentMonthly",
  "netSaleProceeds",
  "preMoveMonthlySaving",
  "ongoingHomeExpensesMonthly",
  "emergencyReserve",
] as const;
/** Changing currency converts amounts; it never just changes the symbol. */
export function changeProfileCurrency(
  p: HouseholdProfile,
  currency: HouseholdProfile["currency"],
): HouseholdProfile {
  const rate = usdRateFor(currency);
  const next = { ...p, currency, usdRate: rate, confirmedByUser: false };
  for (const field of HOME_MONEY_FIELDS) {
    const value = p[field];
    (next as unknown as Record<string, unknown>)[field] =
      value === null ? null : (value * rate) / p.usdRate;
  }
  return next;
}
