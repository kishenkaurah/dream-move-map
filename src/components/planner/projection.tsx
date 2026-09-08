import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { EngineResult } from "@/lib/planner/engine";
import { formatExact } from "@/lib/planner/fx";
import type { HouseholdProfile } from "@/lib/planner/types";

export function ProjectionView({
  result: r,
  profile: p,
}: {
  result: EngineResult;
  profile: HouseholdProfile;
}) {
  const money = (v: number) => formatExact(v, p.currency);
  if (r.errors.length)
    return (
      <div className="rounded-xl border border-dashed p-5">
        <h3 className="display text-xl">Complete your profile to see the projection</h3>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
          {r.errors.map((e, i) => (
            <li key={i}>{e}</li>
          ))}
        </ul>
      </div>
    );
  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <Metric label="Monthly spending at move" value={money(r.monthlySpendingAtMove)} />
        <Metric
          label={
            r.monthlyGapAtMove > 0 ? "Needed from savings each month" : "Monthly surplus at move"
          }
          value={money(r.monthlyGapAtMove || r.monthlySurplusAtMove)}
        />
        <Metric label="Recurring income at move" value={money(r.monthlyIncomeAtMove)} />
        <Metric
          label="Monthly savings allowance at move"
          value={money(r.monthlySavingsAllowanceAtMove)}
        />
        <Metric
          label="Total monthly spending power before home expenses"
          value={money(r.monthlySpendingPowerAtMove)}
        />
        <Metric label="One-off setup expenses" value={money(r.setupCost)} />
        <Metric label="Deposits and visa funds required" value={money(r.restrictedAtMove)} />
        <Metric
          label="Accessible funds after setup"
          value={r.setupShortfall > 0 ? "Move not funded" : money(r.accessibleAfterSetup)}
        />
      </div>
      <p className="text-sm text-muted-foreground">
        At the move, accessible funds before setup are {money(r.accessibleAtMove)}, including any
        net home sale. After setup and your emergency cash target,{" "}
        {r.setupShortfall > 0
          ? "the move is not yet funded"
          : `${money(Math.max(0, r.accessibleAfterSetup - p.emergencyReserve))} remains above that target`}
        . Confirmed, accessible retirement funds can also fund the move.
      </p>
      <div className="rounded-xl border bg-secondary/50 p-5">
        <p className="text-sm font-semibold">
          {r.setupShortfall > 0
            ? `The move needs ${money(r.setupShortfall)} more upfront`
            : r.firstShortfallAge !== null
              ? `First unfunded expense at age ${r.firstShortfallAge.toFixed(1)}`
              : "No unfunded expenses within this projection"}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          {r.setupShortfall > 0
            ? "Projection stops before the move. Add funds or revise setup expenses and required deposits."
            : "This is the result of your stated assumptions, not a guarantee of affordability. Market swings, tax changes and individual eligibility are not simulated."}
        </p>
        {r.belowEmergencyReserveAge !== null && (
          <p className="mt-2 text-sm">
            Cash falls below your emergency target at age {r.belowEmergencyReserveAge.toFixed(1)}.
          </p>
        )}
        {r.totalUnfunded > 0 && !r.setupShortfall && (
          <p className="mt-2 text-sm">
            Cumulative unfunded expenses: {money(r.totalUnfunded)}. Later income does not repay
            these automatically.
          </p>
        )}
      </div>
      <div>
        <h3 className="display text-xl">How your balances could change</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Nominal {p.currency}, before each year's cashflow. Deposits stay separate; the retirement
          balance is not necessarily accessible. The table provides the same data.
        </p>
        <div className="mt-4 h-64 min-w-0" aria-label="Projected savings balances by age">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={r.series} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="age" minTickGap={25} />
              <YAxis
                width={60}
                tickFormatter={(v) =>
                  Math.abs(v) >= 1000000
                    ? `${(v / 1000000).toFixed(1)}m`
                    : `${Math.round(v / 1000)}k`
                }
              />
              <Tooltip formatter={(v: number) => money(v)} labelFormatter={(v) => `Age ${v}`} />
              <Legend />
              <Line
                dataKey="accessible"
                name="Accessible"
                stroke="#15766e"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
              <Line
                dataKey="retirement"
                name="Retirement funds"
                stroke="#213a55"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
              <Line
                dataKey="restricted"
                name="Held deposits"
                stroke="#a66e26"
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <details className="mt-4 rounded-lg border p-3">
          <summary className="cursor-pointer text-sm font-medium">View projection table</summary>
          <Table>
            <caption className="sr-only">
              Projected balances in {p.currency}. Pre-move cashflows are modelled only through the
              net saving contribution.
            </caption>
            <TableHeader>
              <TableRow>
                <TableHead>Age</TableHead>
                <TableHead>Accessible</TableHead>
                <TableHead>Retirement</TableHead>
                <TableHead>Deposits</TableHead>
                <TableHead>Unfunded</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {r.series.map((row) => (
                <TableRow key={row.monthIndex}>
                  <TableCell>{row.age}</TableCell>
                  <TableCell>{money(row.accessible)}</TableCell>
                  <TableCell>{money(row.retirement)}</TableCell>
                  <TableCell>{money(row.restricted)}</TableCell>
                  <TableCell>{money(row.unfunded)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </details>
      </div>
      {r.unknowns.length > 0 && (
        <details open className="rounded-xl border p-4">
          <summary className="cursor-pointer text-sm font-semibold">
            Assumptions still to check
          </summary>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
            {r.unknowns.map((text) => (
              <li key={text}>{text}</li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
export function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-xl border bg-card p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="display mt-1 break-words text-2xl tabular-nums">{value}</p>
    </div>
  );
}
