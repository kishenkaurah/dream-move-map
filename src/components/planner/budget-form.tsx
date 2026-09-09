import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { BUDGET_LABELS, cityById } from "@/lib/planner/city-adapters";
import { citySpending } from "@/lib/planner/spending";
import { formatExact } from "@/lib/planner/fx";
import { HousingSearch } from "./housing-search";
import { NumberField, CheckField } from "./fields";
import type { BudgetItems, CityScenario, HouseholdProfile } from "@/lib/planner/types";
const EXPLORE: Record<string, [string, string]> = {
  groceriesDining: ["restaurants and grocery stores", "Explore food and dining"],
  utilities: ["home internet and utility plans", "Compare internet and utilities"],
  transport: ["public transport fares and taxi prices", "Explore transport options"],
  healthcare: ["international health insurance quotes", "Compare health cover"],
  leisure: ["activities gyms and things to do", "Explore activities"],
  annualReturnTravel: ["return flights", "Explore flights home"],
  otherAdmin: ["retirement visa fees official", "Check visa options"],
};
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
  const spending = citySpending(p, s);
  const rate = p.usdRate;
  const valid = Number.isFinite(rate) && rate > 0;
  const money = (v: number) => formatExact(v, p.currency, 2);
  const set = (patch: Partial<CityScenario>) => onChange({ ...s, ...patch });
  const usd = (v: number | null) => (v === null || !valid ? Number.NaN : v / rate);
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <CheckField
          label="Allocate my budget automatically"
          checked={s.autoAllocate}
          onChange={(v) => set({ autoAllocate: v })}
        />
        <Button variant="ghost" size="sm" onClick={onReset}>
          Reset
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">
        Monthly household amounts in {p.currency}, except annual travel. Editing an amount turns off
        automatic allocation.
      </p>
      <fieldset disabled={!valid} className="grid min-w-0 gap-5 sm:grid-cols-2">
        {Object.entries(BUDGET_LABELS).map(([key, label]) => (
          <div key={key} className="min-w-0 space-y-3">
            <NumberField
              label={label}
              unit={p.currency}
              value={valid ? s.budget[key as keyof BudgetItems] * rate : NaN}
              onChange={(v) => set({ autoAllocate: false, budget: { ...s.budget, [key]: usd(v) } })}
            />
            {key === "housing" ? (
              <HousingSearch scenario={s} profile={p} onChange={onChange} />
            ) : (
              <a
                className="block text-sm text-primary underline"
                href={`https://www.google.com/search?q=${encodeURIComponent(`${city.name} ${city.country} ${EXPLORE[key]![0]}`)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {EXPLORE[key]![1]} ↗
              </a>
            )}
          </div>
        ))}
        <NumberField
          label="Unexpected-cost buffer"
          unit="%"
          value={s.budget.contingencyPct}
          min={0}
          max={100}
          onChange={(v) => set({ budget: { ...s.budget, contingencyPct: v ?? NaN } })}
          hint="Included in the total below. Set 0 for no buffer."
        />
      </fieldset>
      {spending && (
        <section
          className="space-y-3 rounded-xl bg-secondary p-4"
          aria-label="Total overseas spend"
        >
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-3">
              <dt>Living costs + annual travel ÷ 12</dt>
              <dd>{money(spending.subtotal)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt>+ Buffer ({s.budget.contingencyPct}%)</dt>
              <dd>{money(spending.contingency)}</dd>
            </div>
          </dl>
          <div className="border-t pt-3">
            <h3 className="font-semibold">Total overseas spend</h3>
            <p className="display text-3xl">
              {money(spending.total)} <span className="text-base">{p.currency} / month</span>
            </p>
            <p className="text-sm">{money(spending.total * 12)} per year</p>
          </div>
          <p className="text-sm">
            {spending.remaining < -0.005
              ? `${money(-spending.remaining)} above your monthly spending allowance`
              : `${money(Math.max(0, spending.remaining))} left unallocated`}
          </p>
          {(s.lifestyleAdjustPct !== 0 || s.fxStressPct !== 0 || s.expenseStressPct !== 0) && (
            <p className="text-xs">Includes your cost adjustments below.</p>
          )}
        </section>
      )}
      <Accordion type="multiple" className="border-y">
        <AccordionItem value="move">
          <AccordionTrigger>One-off moving costs</AccordionTrigger>
          <AccordionContent className="grid gap-5 px-1 sm:grid-cols-2">
            <NumberField
              label="Moving and setup"
              unit={p.currency}
              value={s.movingSetupCost * rate}
              onChange={(v) => set({ movingSetupCost: usd(v) })}
            />
            <NumberField
              label="Refundable rental deposit"
              unit={p.currency}
              value={s.rentalDeposit * rate}
              onChange={(v) => set({ rentalDeposit: usd(v) })}
            />
            <NumberField
              label="Visa funds to set aside"
              unit={p.currency}
              value={s.visaFundsReserve === null ? null : s.visaFundsReserve * rate}
              onChange={(v) => set({ visaFundsReserve: v === null ? null : usd(v) })}
              hint="Leave blank if unknown."
            />
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="stress">
          <AccordionTrigger>Cost adjustments</AccordionTrigger>
          <AccordionContent className="grid gap-5 px-1 sm:grid-cols-2">
            <NumberField
              label="Lifestyle adjustment"
              unit="%"
              min={-30}
              max={30}
              value={s.lifestyleAdjustPct}
              onChange={(v) => set({ lifestyleAdjustPct: v ?? NaN })}
            />
            <NumberField
              label="Currency loses purchasing power"
              unit="%"
              min={0}
              max={40}
              value={s.fxStressPct}
              onChange={(v) => set({ fxStressPct: v ?? NaN })}
            />
            <NumberField
              label="Extra cost increase"
              unit="%"
              min={0}
              max={40}
              value={s.expenseStressPct}
              onChange={(v) => set({ expenseStressPct: v ?? NaN })}
            />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
