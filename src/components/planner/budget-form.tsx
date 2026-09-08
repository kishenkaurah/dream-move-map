import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { BUDGET_LABELS, adapterFor, cityById, homeCountryLinks } from "@/lib/planner/city-adapters";
import { citySpending, allocateSurplus } from "@/lib/planner/spending";
import { formatExact } from "@/lib/planner/fx";
import { Progress } from "@/components/ui/progress";
import { HousingSearch } from "./housing-search";
import { NumberField } from "./fields";
import type { BudgetItems, CityScenario, HouseholdProfile } from "@/lib/planner/types";

export function BudgetForm({
  scenario: s,
  profile: p,
  onChange,
  onReset,
}: {
  scenario: CityScenario;
  profile: HouseholdProfile;
  onChange: (s: CityScenario) => void;
  onReset: () => void;
}) {
  const city = cityById(s.cityId)!;
  const adapter = adapterFor(city.country);
  const spending = citySpending(p, s);
  const allocation = allocateSurplus(p, s);
  const remaining = spending && Math.abs(spending.remaining) < 0.005 ? 0 : spending?.remaining;
  const money = (value: number) => formatExact(value, p.currency);
  const rate = p.usdRate;
  const usableRate = Number.isFinite(rate) && rate > 0;
  const set = (patch: Partial<CityScenario>) => onChange({ ...s, ...patch });
  const amount = (v: number) => (usableRate ? v * rate : Number.NaN);
  const usd = (v: number | null) => (v === null || !usableRate ? Number.NaN : v / rate);
  const officialLinks = [
    ...adapter.officialLinks,
    ...(p.homeCountry === "AU" ? homeCountryLinks() : []),
  ];
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Today's prices, in {p.currency}. These are editable allowances, not quotes.
        </p>
        <Button type="button" variant="outline" size="sm" onClick={onReset}>
          Reset city allowances
        </Button>
      </div>
      <section
        className="space-y-3 rounded-xl border bg-secondary/50 p-4"
        aria-label="Your city budget and available income"
      >
        <h3 className="text-base font-semibold">How your income covers life in {city.name}</h3>
        {spending ? (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-sm">Income available after home expenses</p>
                <p className="display text-2xl">
                  {money(spending.available)}
                  <span className="text-sm"> / month</span>
                </p>
              </div>
              <div>
                <p className="text-sm">Your city budget at move</p>
                <p className="display text-2xl">
                  {money(spending.total)}
                  <span className="text-sm"> / month</span>
                </p>
              </div>
            </div>
            {spending.available > 0 && (
              <Progress
                value={Math.min(100, (spending.total / spending.available) * 100)}
                aria-label="Share of available income allocated to city costs"
                aria-valuetext={`${Math.round((spending.total / spending.available) * 100)}% of available income allocated`}
              />
            )}
            <p
              role="status"
              className={remaining! < 0 ? "font-semibold text-destructive" : "font-semibold"}
            >
              {remaining! < 0
                ? `${money(-remaining!)} per month needed from savings`
                : `${money(remaining!)} per month left to allocate or save`}
            </p>
            {allocation && (
              <div className="space-y-2 rounded-lg border bg-background p-3">
                <p className="text-sm">
                  You have room to spend more. Spread the remaining {money(spending.remaining)}{" "}
                  across your current allowances in the same proportions.
                </p>
                <Button type="button" variant="outline" onClick={() => onChange(allocation)}>
                  Allocate available income
                </Button>
                <p className="text-sm text-muted-foreground">
                  Keeps your contingency percentage and leaves zero allowances at zero. You can
                  still edit each amount or leave money unspent. These become your spending choices,
                  not market-price estimates.
                </p>
              </div>
            )}
            <details>
              <summary className="cursor-pointer text-sm font-medium">
                Where your monthly budget goes
              </summary>
              <dl className="mt-3 space-y-2 text-sm">
                {spending.lines.map((line) => (
                  <div key={line.key} className="flex justify-between gap-3">
                    <dt>
                      {line.key === "annualReturnTravel"
                        ? "Flights home (monthly allowance)"
                        : BUDGET_LABELS[line.key as keyof typeof BUDGET_LABELS]}
                    </dt>
                    <dd className="shrink-0 tabular-nums">{money(line.amount)}</dd>
                  </div>
                ))}
                <div className="flex justify-between gap-3">
                  <dt>Contingency</dt>
                  <dd>{money(spending.contingency)}</dd>
                </div>
              </dl>
            </details>
            <p className="text-sm text-muted-foreground">
              {spending.housingLimitToday >= 0
                ? `Keeping all other choices, income could cover up to ${money(spending.housingLimitToday)} per month in the housing field below.`
                : "Other costs already exceed available income, even before housing."}{" "}
              This is a spending limit, not a rental-price estimate.
            </p>
            <p className="text-sm text-muted-foreground">
              Totals are in {p.currency} at your move date, including inflation, contingency and
              your stress settings. Edit the allowances below to see the trade-offs. The savings
              projection checks how withdrawals affect your balances over time.
            </p>
            {p.prefilledFromQuiz && !p.confirmedByUser && (
              <p className="text-sm text-muted-foreground">
                Income is still an unconfirmed estimate from your quiz.
              </p>
            )}
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            Complete your age, move age and income in the financial profile, and correct any invalid
            budget inputs, to connect your available income to these city costs.
          </p>
        )}
      </section>
      {!usableRate && (
        <p role="alert" className="text-sm text-destructive">
          Correct the exchange rate in your financial profile before editing costs.
        </p>
      )}
      <fieldset disabled={!usableRate} className="grid min-w-0 gap-5 sm:grid-cols-2">
        {Object.entries(BUDGET_LABELS).map(([key, label]) => (
          <NumberField
            key={key}
            label={label}
            unit={p.currency}
            value={amount(s.budget[key as keyof BudgetItems])}
            onChange={(v) => set({ budget: { ...s.budget, [key]: usd(v) } })}
            hint={
              key === "annualReturnTravel"
                ? "Annual total for your household, divided by 12 once."
                : key === "healthcare"
                  ? "Replace with an insurance quote plus routine care; do not add the allowance again."
                  : undefined
            }
          />
        ))}
        <NumberField
          label="Contingency on living costs"
          unit="%"
          value={s.budget.contingencyPct}
          min={0}
          max={100}
          onChange={(v) => set({ budget: { ...s.budget, contingencyPct: v ?? Number.NaN } })}
        />
      </fieldset>
      <HousingSearch key={s.id} scenario={s} profile={p} />
      <Accordion type="multiple" defaultValue={["move"]} className="border-y">
        <AccordionItem value="move">
          <AccordionTrigger>Cash needed for the move</AccordionTrigger>
          <AccordionContent className="grid gap-5 px-1 sm:grid-cols-2">
            <NumberField
              label="One-off moving and setup expenses"
              unit={p.currency}
              value={amount(s.movingSetupCost)}
              onChange={(v) => set({ movingSetupCost: usd(v) })}
              hint="Enter expected cost at your move date. Does not include refundable deposits."
            />
            <NumberField
              label="Refundable accommodation deposit"
              unit={p.currency}
              value={amount(s.rentalDeposit)}
              onChange={(v) => set({ rentalDeposit: usd(v) })}
              hint="Still your asset, but held outside spendable funds throughout this projection."
            />
            <NumberField
              label="Confirmed visa funds to set aside"
              unit={p.currency}
              value={s.visaFundsReserve === null ? null : amount(s.visaFundsReserve)}
              onChange={(v) => set({ visaFundsReserve: v === null ? null : usd(v) })}
              hint="Leave blank if unknown; enter 0 only if you have checked that no reserve is needed. Deposits are separate from visa fees."
            />
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="stress" className="border-b-0">
          <AccordionTrigger>What if your costs change?</AccordionTrigger>
          <AccordionContent className="grid gap-5 px-1 sm:grid-cols-2">
            <NumberField
              label="Lifestyle change"
              unit="%"
              value={s.lifestyleAdjustPct}
              min={-30}
              max={30}
              onChange={(v) => set({ lifestyleAdjustPct: v ?? Number.NaN })}
              hint="Adjusts every overseas living-cost line, including health and travel. Negative means a lower budget."
            />
            <NumberField
              label="Home currency buys less overseas"
              unit="%"
              value={s.fxStressPct}
              min={0}
              max={40}
              onChange={(v) => set({ fxStressPct: v ?? Number.NaN })}
              hint="15% less purchasing power means the same overseas costs require 1 ÷ 0.85, or 17.6% more home currency. Home income and expenses are unchanged."
            />
            <NumberField
              label="Additional overseas expense increase"
              unit="%"
              value={s.expenseStressPct}
              min={0}
              max={40}
              onChange={(v) => set({ expenseStressPct: v ?? Number.NaN })}
            />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
      <div className="space-y-3 rounded-xl bg-secondary/60 p-4 text-sm leading-6">
        <h3 className="font-semibold">What to verify in {city.country}</h3>
        <ul className="list-disc space-y-1 pl-5">
          {adapter.knownGaps.map((gap) => (
            <li key={gap}>{gap}</li>
          ))}
        </ul>
        {officialLinks.map((link) => (
          <a
            key={link.url}
            href={link.url}
            target="_blank"
            rel="noreferrer"
            className="block text-primary underline underline-offset-4"
          >
            {link.label}
          </a>
        ))}
        <p className="text-muted-foreground">
          {adapter.provenance} Source prices and check date are unverified. No automatic visa
          eligibility or tax calculation is included.
        </p>
      </div>
    </div>
  );
}
