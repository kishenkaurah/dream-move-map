import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { NumberField, ChoiceField, CheckField } from "./fields";
import type { HouseholdProfile, CityScenario } from "@/lib/planner/types";
import { formatExact } from "@/lib/planner/fx";
import { incomeAtMove } from "@/lib/planner/spending";
import { changeProfileCurrency } from "@/lib/planner/quiz-bridge";

const requiredNumber = (n: number | null) => n ?? Number.NaN;
export function ProfileForm({
  profile: p,
  scenario,
  onChange,
}: {
  profile: HouseholdProfile;
  scenario?: CityScenario | null;
  onChange: (p: HouseholdProfile) => void;
}) {
  const set = (patch: Partial<HouseholdProfile>) =>
    onChange({ ...p, ...patch, confirmedByUser: false });
  const unit = p.currency;
  const summary = incomeAtMove(p, scenario);
  const validIncome = summary !== null;
  const { rent = 0, later = 0, income = 0, homeCosts = 0 } = summary ?? {};
  const money = (value: number) => formatExact(value, p.currency);

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Enter household totals once. They apply to every city you compare. Blank means unknown;
        enter 0 when you have none.
      </p>
      {p.prefilledFromQuiz && !p.confirmedByUser && (
        <p className="rounded-lg bg-secondary p-3 text-sm">
          Your income is a suggested midpoint from the quiz, not a confirmed amount. Replace it with
          income excluding withdrawals from the savings entered below.
        </p>
      )}
      <div className="grid gap-5 sm:grid-cols-2">
        <ChoiceField
          label="Home country"
          value={p.homeCountry}
          choices={[
            ["AU", "Australia"],
            ["OTHER", "Another country / confirm country"],
          ]}
          onChange={(v) => set({ homeCountry: v as HouseholdProfile["homeCountry"] })}
        />
        <ChoiceField
          label="Your currency"
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
            ["family", "Household with children"],
          ]}
          onChange={(v) => set({ household: v as HouseholdProfile["household"] })}
        />
        <NumberField
          label="Your age now"
          value={p.currentAge}
          onChange={(v) => set({ currentAge: v })}
          min={18}
          max={120}
        />
        <NumberField
          label="Age when you plan to move"
          value={p.moveAge}
          onChange={(v) => set({ moveAge: v })}
          min={18}
          max={120}
        />
        <NumberField
          label="After-tax income per month after moving"
          value={p.monthlyIncomeNow}
          onChange={(v) => set({ monthlyIncomeNow: v })}
          unit={unit}
          hint="Exclude savings withdrawals, rental cashflow and later income entered separately. Assumed to continue throughout the projection."
        />
        <NumberField
          label="Accessible cash and investments today"
          value={p.accessibleFunds}
          onChange={(v) => set({ accessibleFunds: v })}
          unit={unit}
          hint="Exclude super, pension pots, and future home-sale proceeds entered separately."
        />
        <NumberField
          label={
            p.homeCountry === "AU"
              ? "Super balance today"
              : "Separate retirement fund balance today"
          }
          value={p.retirementFunds}
          onChange={(v) => set({ retirementFunds: v })}
          unit={unit}
        />
      </div>
      <div className="space-y-3 rounded-xl border p-4">
        <NumberField
          label="Annual savings withdrawal allowance"
          unit="%"
          value={(p.withdrawalRateAnnual ?? 0.04) * 100}
          min={0}
          max={20}
          onChange={(v) => set({ withdrawalRateAnnual: requiredNumber(v) / 100 })}
          hint="Starts at 4% of funds available at your move, after entered setup costs and deposits. This adds to your spending power and is separate from investment returns. Set 0 to exclude it."
        />
        {summary?.savings && (
          <p className="text-sm">
            On today's accessible savings: {money(summary.savings.todayMonthly)} {unit} / month. At
            your move: {money(summary.savingsMonthly)} {unit} / month, based on projected available
            funds of {money(summary.savings.base)}.
          </p>
        )}
      </div>
      <p className="text-sm text-muted-foreground">
        Household size selects the starting city cost estimate and suggests a bedroom count for
        rental searches. It does not increase your income. When you allocate all available income,
        the total stays the same for every household; edit the categories for your family's needs.
      </p>
      {(p.retirementFunds ?? 0) > 0 && (
        <div className="space-y-4 rounded-xl border p-4">
          <NumberField
            label="Age you can access those retirement funds"
            value={p.retirementAccessAge}
            min={18}
            max={120}
            onChange={(v) => set({ retirementAccessAge: v, retirementAccessConfirmed: false })}
            hint="Enter an age you have checked for your circumstances; we do not determine eligibility."
          />
          <CheckField
            label="I have checked this access age. Include these funds for withdrawals from that age."
            checked={p.retirementAccessConfirmed}
            onChange={(v) => set({ retirementAccessConfirmed: v })}
          />
        </div>
      )}
      <Accordion type="multiple" className="border-y">
        <AccordionItem value="home">
          <AccordionTrigger>Your home and the move</AccordionTrigger>
          <AccordionContent className="space-y-5 px-1">
            <ChoiceField
              label="What happens to your home?"
              value={p.homeProperty}
              choices={[
                ["none", "No owned home"],
                ["keep", "Keep it without renting"],
                ["rent", "Rent it out"],
                ["sell", "Sell at the move"],
              ]}
              onChange={(v) => set({ homeProperty: v as HouseholdProfile["homeProperty"] })}
            />
            {p.homeProperty === "rent" && (
              <NumberField
                label="Net monthly rental cashflow"
                unit={unit}
                value={p.netRentMonthly}
                min={-1e8}
                max={1e8}
                onChange={(v) => set({ netRentMonthly: requiredNumber(v) })}
                hint="After mortgage payments, management, maintenance and tax. A loss can be negative. Do not also include this in recurring income."
              />
            )}
            {p.homeProperty === "sell" && (
              <NumberField
                label="Net sale proceeds at the move"
                unit={unit}
                value={p.netSaleProceeds}
                onChange={(v) => set({ netSaleProceeds: requiredNumber(v) })}
                hint="After outstanding loans, selling costs and tax. Do not also include this in today's savings."
              />
            )}
            <NumberField
              label="Ongoing home-country expenses per month"
              unit={unit}
              value={p.ongoingHomeExpensesMonthly}
              onChange={(v) => set({ ongoingHomeExpensesMonthly: requiredNumber(v) })}
              hint="Include only expenses not already deducted from net rental cashflow. These are not affected by currency stress."
            />
            <NumberField
              label="Net monthly saving before the move"
              unit={unit}
              value={p.preMoveMonthlySaving}
              onChange={(v) => set({ preMoveMonthlySaving: requiredNumber(v) })}
              hint="After all current income and spending. Used only for months before your move; no other pre-move cashflows are assumed."
            />
            <NumberField
              label="Emergency cash reserve"
              unit={unit}
              value={p.emergencyReserve}
              onChange={(v) => set({ emergencyReserve: requiredNumber(v) })}
              hint="A warning threshold, not an expense. The projection can draw below it and will flag when that happens."
            />
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="later">
          <AccordionTrigger>Income that starts later</AccordionTrigger>
          <AccordionContent className="space-y-5 px-1">
            <NumberField
              label="Additional monthly income"
              value={p.laterIncomeMonthly}
              unit={unit}
              onChange={(v) =>
                set({ laterIncomeMonthly: requiredNumber(v), laterIncomeConfirmed: false })
              }
              hint="For example, a government pension you have checked. Added to your recurring income, not a replacement for it."
            />
            {p.laterIncomeMonthly > 0 && (
              <>
                <NumberField
                  label="Age this income starts"
                  value={p.laterIncomeStartAge}
                  min={18}
                  max={120}
                  onChange={(v) => set({ laterIncomeStartAge: v, laterIncomeConfirmed: false })}
                />
                <CheckField
                  label="I have checked the amount, start age and whether I can receive it overseas. Include it in the projection."
                  checked={p.laterIncomeConfirmed}
                  onChange={(v) => set({ laterIncomeConfirmed: v })}
                />
              </>
            )}
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="assumptions" className="border-b-0">
          <AccordionTrigger>Projection and exchange-rate assumptions</AccordionTrigger>
          <AccordionContent className="space-y-5 px-1">
            <NumberField
              label="Years to project from today"
              value={p.horizonYears}
              min={1}
              max={60}
              step={1}
              onChange={(v) => set({ horizonYears: requiredNumber(v) })}
            />
            <NumberField
              label="Annual nominal return after fees and tax"
              unit="%"
              value={p.returnRateAnnual * 100}
              min={-90}
              max={50}
              onChange={(v) => set({ returnRateAnnual: requiredNumber(v) / 100 })}
              hint="The editable return assumption applies to both cash/investments and retirement funds after fees and tax, before inflation. New plans start at 7% return and 3% inflation; your saved assumptions are kept. It is not a forecast for your investments. Actual returns vary."
            />
            <NumberField
              label="Annual expense inflation"
              unit="%"
              value={p.inflationAnnual * 100}
              min={0}
              max={30}
              onChange={(v) => set({ inflationAnnual: requiredNumber(v) / 100 })}
              hint="Expenses inflate from today's prices. Income and cash reserves are fixed in nominal terms."
            />
            <NumberField
              label={`1 USD equals how many ${unit}?`}
              value={p.usdRate}
              min={0.0001}
              max={10000}
              onChange={(v) => set({ usdRate: requiredNumber(v) })}
              hint="Indicative rate, not live; capture date unknown. Updating it changes overseas costs, not the home-currency amounts you entered."
            />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
      <section
        className="space-y-3 rounded-xl border bg-secondary/50 p-4"
        aria-label="Monthly spending power at your move"
      >
        <h3 className="text-base font-semibold">Monthly spending power at your move</h3>
        {validIncome ? (
          <>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt>Recurring after-tax income</dt>
                <dd>{money(p.monthlyIncomeNow!)}</dd>
              </div>
              {p.homeProperty === "rent" && (
                <div className="flex justify-between gap-4">
                  <dt>Net rental cashflow</dt>
                  <dd>{money(rent)}</dd>
                </div>
              )}
              {later > 0 && (
                <div className="flex justify-between gap-4">
                  <dt>Confirmed additional income at move</dt>
                  <dd>{money(later)}</dd>
                </div>
              )}
              <div className="flex justify-between gap-4 font-semibold">
                <dt>Total monthly income</dt>
                <dd>{money(income)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt>Ongoing home expenses at move</dt>
                <dd>{money(homeCosts)}</dd>
              </div>
            </dl>
            <div className="flex justify-between gap-4 text-sm">
              <span>
                Savings withdrawal allowance ({((p.withdrawalRateAnnual ?? 0.04) * 100).toFixed(1)}%
                a year)
              </span>
              <span>
                {summary.savings ? money(summary.savingsMonthly) : "Enter valid savings inputs"}
              </span>
            </div>
            <div className="border-t pt-3">
              <p className="text-sm">
                {summary.available >= 0
                  ? "Total available for life abroad, including savings"
                  : "Monthly shortfall before overseas costs"}
              </p>
              <p className="display mt-1 text-2xl">
                {money(Math.abs(summary.available))} <span className="text-sm">{unit} / month</span>
              </p>
            </div>
          </>
        ) : (
          <p className="text-sm">
            Enter valid current and move ages and monthly income to see your total. Enter 0 if you
            have no recurring income.
          </p>
        )}
        {p.laterIncomeMonthly > 0 && later === 0 && (
          <p className="text-sm text-muted-foreground">
            Additional income is excluded from this total until its confirmed start age has been
            reached.
          </p>
        )}
        <p className="text-sm text-muted-foreground">
          Before overseas living costs. The savings allowance uses your projected funds at the move,
          including net sale proceeds and retirement funds confirmed accessible then, less entered
          setup costs and deposits. Actual spending from savings reduces your balances; unused
          allowance stays invested. Withdrawal taxes are not calculated. The 4% allowance is a
          planning assumption, not guaranteed income.{" "}
          <a
            className="underline"
            target="_blank"
            rel="noreferrer"
            href="https://www.schwab.com/learn/story/beyond-4-rule-how-much-can-you-spend-retirement"
          >
            About the 4% guideline
          </a>
          .
        </p>
        {p.prefilledFromQuiz && !p.confirmedByUser && (
          <p className="text-sm text-muted-foreground">
            This total still uses an unconfirmed income estimate from your quiz.
          </p>
        )}
      </section>
      <CheckField
        label="I have reviewed my financial inputs and understand that the results depend on these assumptions."
        checked={p.confirmedByUser}
        onChange={(v) => onChange({ ...p, confirmedByUser: v })}
      />
    </div>
  );
}
