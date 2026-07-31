import { healthcareLabel, visaComplexityLabel } from "@/components/destination-result-card";
import type { DestinationResult } from "@/lib/scoring";
import { FACTOR_LABELS, type FactorKey } from "@/data/destinations";

const FACTOR_ORDER: FactorKey[] = [
  "affordability",
  "visa",
  "healthcare",
  "lifestyle",
  "climate",
  "language",
  "proximity",
  "bureaucracy",
];

export function ComparisonTable({ results }: { results: DestinationResult[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-[var(--shadow-card)]">
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <caption className="sr-only">
          Side-by-side comparison of your top destination matches
        </caption>
        <thead>
          <tr className="border-b border-border bg-secondary/50">
            <th scope="col" className="p-3 text-left font-semibold">
              Factor
            </th>
            {results.map((r) => (
              <th key={r.destination.id} scope="col" className="p-3 text-left font-semibold">
                <span aria-hidden="true">{r.destination.emoji}</span> {r.destination.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-border">
            <th scope="row" className="p-3 text-left font-medium">
              Overall match
            </th>
            {results.map((r) => (
              <td key={r.destination.id} className="p-3 font-semibold tabular-nums text-primary">
                {r.overall}%
              </td>
            ))}
          </tr>
          <tr className="border-b border-border">
            <th scope="row" className="p-3 text-left font-medium">
              Est. monthly budget
            </th>
            {results.map((r) => (
              <td key={r.destination.id} className="p-3 tabular-nums">
                ${r.budgetRange[0].toLocaleString()} – ${r.budgetRange[1].toLocaleString()}
              </td>
            ))}
          </tr>
          <tr className="border-b border-border">
            <th scope="row" className="p-3 text-left font-medium">
              Visa complexity
            </th>
            {results.map((r) => (
              <td key={r.destination.id} className="p-3">
                {visaComplexityLabel(r.destination.visa.complexity)}
              </td>
            ))}
          </tr>
          <tr className="border-b border-border">
            <th scope="row" className="p-3 text-left font-medium">
              Healthcare
            </th>
            {results.map((r) => (
              <td key={r.destination.id} className="p-3">
                {healthcareLabel(r.destination.healthcare.rating)}
              </td>
            ))}
          </tr>
          {FACTOR_ORDER.map((key) => (
            <tr key={key} className="border-b border-border last:border-b-0">
              <th scope="row" className="p-3 text-left font-normal text-muted-foreground">
                {FACTOR_LABELS[key]} score
              </th>
              {results.map((r) => {
                const f = r.factors.find((x) => x.key === key);
                return (
                  <td key={r.destination.id} className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-secondary">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${f?.score ?? 0}%` }}
                        />
                      </div>
                      <span className="tabular-nums text-muted-foreground">{f?.score ?? 0}</span>
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
