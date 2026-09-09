import { citySpending } from "@/lib/planner/spending";
import { cityById, seedMonthlyTotal } from "@/lib/planner/city-adapters";
import { formatExact } from "@/lib/planner/fx";
import type { HouseholdProfile, CityScenario } from "@/lib/planner/types";
export function LifestyleSummary({
  profile: p,
  scenario: s,
}: {
  profile: HouseholdProfile;
  scenario: CityScenario;
}) {
  const city = cityById(s.cityId)!;
  const spending = citySpending(p, s);
  if (!spending || !spending.savings)
    return (
      <section className="rounded-xl bg-secondary p-5">
        <h2 className="display text-2xl">Your life in {city.name}</h2>
        <p className="mt-2 text-sm">
          Add your income and savings below to see your lifestyle budget.
        </p>
      </section>
    );
  const money = (v: number) => formatExact(v, p.currency);
  const line = (key: string) => spending.lines.find((x) => x.key === key)?.amount ?? 0;
  const ratio = spending.subtotal / (seedMonthlyTotal(city, p.household) * p.usdRate);
  const label =
    ratio >= 1.4
      ? "Room for more choice"
      : ratio >= 0.9
        ? "An everyday lifestyle budget"
        : "A budget that needs careful choices";
  return (
    <section
      className="space-y-3 rounded-xl border bg-secondary p-5"
      aria-label="Your city lifestyle summary"
    >
      <p className="text-sm">Your life in {city.name}</p>
      <h2 className="display text-2xl">{label}</h2>
      <p>
        With{" "}
        <strong>
          {money(spending.total)} {p.currency} a month
        </strong>
        , your plan allows {money(line("housing"))} for housing, about{" "}
        {money((line("groceriesDining") * 12) / 365)} a day for food and dining, and{" "}
        {money(line("leisure"))} a month for leisure.
      </p>
      <p className="text-sm">
        Includes {money(line("annualReturnTravel") * 12)} a year for trips home and{" "}
        {money(spending.contingency)} a month for unexpected costs.
      </p>
      <p className="text-xs text-muted-foreground">
        Based on your household allowances and the city's indicative cost model. Explore the links
        below for actual options.
      </p>
    </section>
  );
}
