import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { NumberField, ChoiceField } from "./fields";
import type { HouseholdProfile, CityScenario } from "@/lib/planner/types";
import { formatExact } from "@/lib/planner/fx";
import { incomeAtMove } from "@/lib/planner/spending";
import { changeProfileCurrency } from "@/lib/planner/quiz-bridge";

export function ProfileForm({
  profile: p,
  scenario,
  onChange,
}: {
  profile: HouseholdProfile;
  scenario?: CityScenario | null;
  onChange: (p: HouseholdProfile) => void;
}) {
  const set = (patch: Partial<HouseholdProfile>) => onChange({ ...p, ...patch });
  const number = (v: number | null) => v ?? Number.NaN;
  const summary = incomeAtMove(p, scenario);
  const money = (v: number) => formatExact(v, p.currency);
  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        Your household's budget, using money available now.
      </p>
      <div className="grid gap-5 sm:grid-cols-2">
        <ChoiceField
          label="Home country"
          value={p.homeCountry}
          choices={[
            ["AU", "Australia"],
            ["OTHER", "Another country"],
          ]}
          onChange={(v) => set({ homeCountry: v as HouseholdProfile["homeCountry"] })}
        />
        <ChoiceField
          label="Currency"
          value={p.currency}
          choices={[
            ["AUD", "AUD — Australian dollar"],
            ["USD", "USD — US dollar"],
            ["GBP", "GBP — British pound"],
            ["EUR", "EUR — euro"],
          ]}
          onChange={(v) => onChange(changeProfileCurrency(p, v as HouseholdProfile["currency"]))}
        />
        <ChoiceField
          label="Household"
          value={p.household}
          choices={[
            ["solo", "One adult"],
            ["couple", "Two adults"],
            ["family", "Family with children"],
          ]}
          onChange={(v) => set({ household: v as HouseholdProfile["household"] })}
        />
        <NumberField
          label="Monthly income after tax"
          value={p.monthlyIncomeNow}
          unit={p.currency}
          onChange={(v) => set({ monthlyIncomeNow: v })}
          hint="Income you can receive abroad. Exclude savings withdrawals and rent entered below."
        />
        <NumberField
          label="Accessible savings and investments"
          value={p.accessibleFunds}
          unit={p.currency}
          onChange={(v) => set({ accessibleFunds: v })}
          hint="Exclude super and property sale proceeds entered separately."
        />
        <NumberField
          label="Annual savings withdrawal"
          value={p.withdrawalRateAnnual * 100}
          unit="%"
          min={0}
          max={20}
          onChange={(v) => set({ withdrawalRateAnnual: number(v) / 100 })}
          hint="4% of your available savings each year. Adjustable; not guaranteed income."
        />
      </div>
      {summary?.savings && (
        <p className="rounded-lg bg-secondary p-3 text-sm">
          Your savings allowance:{" "}
          <strong>
            {money(summary.savingsMonthly)} {p.currency} / month
          </strong>
          .
        </p>
      )}
      <Accordion type="multiple" className="border-y">
        <AccordionItem value="other">
          <AccordionTrigger>Property, super and other costs</AccordionTrigger>
          <AccordionContent className="space-y-5 px-1">
            <ChoiceField
              label="Your home"
              value={p.homeProperty}
              choices={[
                ["none", "No owned home"],
                ["keep", "Keep it"],
                ["rent", "Rent it out"],
                ["sell", "Sell it"],
              ]}
              onChange={(v) => set({ homeProperty: v as HouseholdProfile["homeProperty"] })}
            />
            {p.homeProperty === "rent" && (
              <NumberField
                label="Monthly rent after all costs and tax"
                unit={p.currency}
                value={p.netRentMonthly}
                min={-1e8}
                max={1e8}
                onChange={(v) => set({ netRentMonthly: number(v) })}
              />
            )}
            {p.homeProperty === "sell" && (
              <NumberField
                label="Net sale proceeds"
                unit={p.currency}
                value={p.netSaleProceeds}
                onChange={(v) => set({ netSaleProceeds: number(v) })}
                hint="After loans, fees and tax; added to savings once."
              />
            )}
            <NumberField
              label="Super / separate retirement funds"
              value={p.retirementFunds}
              unit={p.currency}
              onChange={(v) => set({ retirementFunds: v })}
            />
            {(p.retirementFunds ?? 0) > 0 && (
              <ChoiceField
                label="Can you access these funds now?"
                value={p.retirementAccessConfirmed ? "yes" : "no"}
                choices={[
                  ["no", "No — exclude from spending"],
                  ["yes", "Yes — include"],
                ]}
                onChange={(v) => set({ retirementAccessConfirmed: v === "yes" })}
              />
            )}
            <NumberField
              label="Monthly costs you keep paying at home"
              value={p.ongoingHomeExpensesMonthly}
              unit={p.currency}
              onChange={(v) => set({ ongoingHomeExpensesMonthly: number(v) })}
            />
            <NumberField
              label="Emergency savings target"
              value={p.emergencyReserve}
              unit={p.currency}
              onChange={(v) => set({ emergencyReserve: number(v) })}
            />
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="assumptions">
          <AccordionTrigger>Projection settings</AccordionTrigger>
          <AccordionContent className="grid gap-5 px-1 sm:grid-cols-2">
            <NumberField
              label="Years to project"
              value={p.horizonYears}
              min={1}
              max={60}
              step={1}
              onChange={(v) => set({ horizonYears: number(v) })}
            />
            <NumberField
              label="Annual return after tax and fees"
              value={p.returnRateAnnual * 100}
              unit="%"
              min={-90}
              max={50}
              onChange={(v) => set({ returnRateAnnual: number(v) / 100 })}
            />
            <NumberField
              label="Annual inflation"
              value={p.inflationAnnual * 100}
              unit="%"
              min={0}
              max={30}
              onChange={(v) => set({ inflationAnnual: number(v) / 100 })}
            />
            <NumberField
              label={`1 USD in ${p.currency}`}
              value={p.usdRate}
              min={0.0001}
              max={10000}
              onChange={(v) => set({ usdRate: number(v) })}
              hint="Editable estimate, not a live exchange rate."
            />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
      <section
        className="space-y-2 rounded-xl bg-secondary p-4"
        aria-label="Monthly spending power"
      >
        <h3 className="font-semibold">Available to spend abroad</h3>
        {summary ? (
          <>
            <p className="display text-3xl">
              {money(summary.available)} <span className="text-base">{p.currency} / month</span>
            </p>
            <p className="text-sm">
              {money(summary.income)} income + {money(summary.savingsMonthly)} from savings −{" "}
              {money(summary.homeCosts)} home costs.
            </p>
          </>
        ) : (
          <p className="text-sm">Add your income and savings. Enter 0 if none.</p>
        )}
      </section>
    </div>
  );
}
