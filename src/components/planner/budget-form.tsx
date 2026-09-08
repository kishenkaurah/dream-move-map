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
import { NumberField, CheckField } from "./fields";
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
  const money = (value: number) => formatExact(value, p.currency, 2);
  const rate = p.usdRate;
  const usableRate = Number.isFinite(rate) && rate > 0;
  const set = (patch: Partial<CityScenario>) => onChange({ ...s, ...patch });
  const amount = (v: number) => (usableRate ? v * rate : Number.NaN);
  const usd = (v: number | null) => (v === null || !usableRate ? Number.NaN : v / rate);
  const inputSubtotal =
    Object.entries(s.budget)
      .filter(([key]) => key !== "contingencyPct")
      .reduce((sum, [key, value]) => sum + value / (key === "annualReturnTravel" ? 12 : 1), 0) *
    rate;
  const inputBuffer = (inputSubtotal * s.budget.contingencyPct) / 100;
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
      <CheckField
        label="Automatically allocate my available income and savings allowance"
        checked={s.autoAllocate}
        onChange={(v) => set({ autoAllocate: v })}
      />
      <p className="text-sm text-muted-foreground">
        Automatic mode updates every category when your income or withdrawal rate changes, including
        an annual return-home travel allowance. Editing a category switches to manual mode.
        Allocations are spending choices, not quotes or a guarantee that the city is affordable.
      </p>
      <section
        className="space-y-3 rounded-xl border bg-secondary/50 p-4"
        aria-label="Your city budget and available income"
      >
        <h3 className="text-base font-semibold">Your total overseas budget in {city.name}</h3>
        {spending ? (
          <>
            <div className="rounded-lg bg-background p-4">
              <p className="text-sm font-semibold">Total overseas spend at your move</p>
              <p className="display mt-1 text-3xl">
                {money(spending.total)} <span className="text-base">{p.currency} / month</span>
              </p>
              <p className="mt-1 text-sm">
                {money(spending.total * 12)} {p.currency} per year, including travel and your
                unexpected-cost buffer.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-sm">Spending power including savings, after home expenses</p>
                <p className="display text-2xl">
                  {money(spending.available)}
                  <span className="text-sm"> / month</span>
                </p>
              </div>
              <div>
                <p className="text-sm">Included buffer for unexpected costs</p>
                <p className="display text-2xl">
                  {money(spending.contingency)}
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
                ? `${money(-remaining!)} per month above your income and savings allowance`
                : `${money(remaining!)} per month of spending power unallocated`}
            </p>
            {allocation && (
              <div className="space-y-2 rounded-lg border bg-background p-3">
                <p className="text-sm">
                  You have room to spend more. Spread the remaining {money(spending.remaining)}{" "}
                  across your current allowances in the same proportions.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onChange({ ...allocation, autoAllocate: false })}
                >
                  Allocate available income
                </Button>
                <p className="text-sm text-muted-foreground">
                  Keeps your buffer percentage and leaves zero allowances at zero. You can still
                  edit each amount or leave money unspent. These become your spending choices, not
                  market-price estimates.
                </p>
              </div>
            )}
            <div>
              <h4 className="text-sm font-semibold">
                How the monthly total adds up ({p.currency} at your move)
              </h4>
              <dl className="mt-3 space-y-2 text-sm">
                {spending.lines.map((line) => (
                  <div key={line.key} className="flex justify-between gap-3">
                    <dt>
                      {line.key === "annualReturnTravel"
                        ? "Return-home travel (annual allowance ÷ 12)"
                        : BUDGET_LABELS[line.key as keyof typeof BUDGET_LABELS]}
                    </dt>
                    <dd className="shrink-0 tabular-nums">{money(line.amount)}</dd>
                  </div>
                ))}
                <div className="flex justify-between gap-3 border-t pt-2 font-medium">
                  <dt>Living costs + travel subtotal</dt>
                  <dd className="shrink-0">{money(spending.subtotal)}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt>+ Unexpected-cost buffer ({s.budget.contingencyPct}%)</dt>
                  <dd className="shrink-0">{money(spending.contingency)}</dd>
                </div>
                <div className="flex justify-between gap-3 border-t pt-2 font-bold">
                  <dt>= Total overseas spend / month</dt>
                  <dd className="shrink-0">{money(spending.total)}</dd>
                </div>
              </dl>
              <p className="mt-2 text-sm text-muted-foreground">
                The buffer is included once in the total above. It is extra room for unexpected
                costs, not a separate bill. Home-country expenses and one-off moving costs are
                excluded.
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              {spending.housingLimitToday >= 0
                ? `Keeping all other choices, income and the savings allowance could cover up to ${money(spending.housingLimitToday)} per month in the housing field below.`
                : "Other costs already exceed available income, even before housing."}{" "}
              This is a spending limit, not a rental-price estimate.
            </p>
            <p className="text-sm text-muted-foreground">
              Totals are in {p.currency} at your move date, including inflation, the unexpected-cost
              buffer and your stress settings. Edit the allowances below to see the trade-offs.
              Available spending power includes {money(spending.savingsMonthly)} per month from your
              savings allowance. Unused allowance stays invested. The projection deducts actual
              spending above recurring income from savings.
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
            onChange={(v) => set({ autoAllocate: false, budget: { ...s.budget, [key]: usd(v) } })}
            hint={
              key === "annualReturnTravel"
                ? "Annual household allowance, divided by 12 in monthly totals. Automatic mode assigns 5% of the budget before the buffer to travel; replace it with your expected annual cost."
                : key === "healthcare"
                  ? "Replace with an insurance quote plus routine care; do not add the allowance again."
                  : undefined
            }
          />
        ))}
        <NumberField
          label="Buffer for unexpected costs"
          unit="%"
          value={s.budget.contingencyPct}
          min={0}
          max={100}
          onChange={(v) => set({ budget: { ...s.budget, contingencyPct: v ?? Number.NaN } })}
          hint="Percentage of all living costs plus the monthly travel allowance. Included once in your total. In automatic mode, a larger buffer leaves less for the other categories. Set 0 for no buffer."
        />
      </fieldset>
      {spending && (
        <section
          className="space-y-2 rounded-xl border bg-secondary/50 p-4"
          aria-label="Total of the amounts entered above"
        >
          <h3 className="font-semibold">Total of your entries above — today's prices</h3>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-3">
              <dt>Monthly categories + annual travel ÷ 12</dt>
              <dd className="shrink-0">{money(inputSubtotal)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt>+ Unexpected-cost buffer ({s.budget.contingencyPct}%)</dt>
              <dd className="shrink-0">{money(inputBuffer)}</dd>
            </div>
            <div className="flex justify-between gap-3 border-t pt-2 font-semibold">
              <dt>= Monthly total before adjustments</dt>
              <dd className="shrink-0">{money(inputSubtotal + inputBuffer)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt>+ Move-date inflation and lifestyle / stress adjustments</dt>
              <dd className="shrink-0">{money(spending.total - inputSubtotal - inputBuffer)}</dd>
            </div>
            <div className="flex justify-between gap-3 border-t pt-2 font-bold">
              <dt>= Total overseas spend at move</dt>
              <dd className="shrink-0">{money(spending.total)} / month</dd>
            </div>
          </dl>
          <p className="text-sm text-muted-foreground">
            All amounts in {p.currency}. Annual travel is divided by 12, not added as a monthly
            bill. Totals use unrounded values; displayed rows may differ by a cent.
          </p>
        </section>
      )}
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
