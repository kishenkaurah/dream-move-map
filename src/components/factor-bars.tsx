import type { FactorResult } from "@/lib/scoring";

/** "Why this matched" — labelled horizontal bars, one per scoring factor. */
export function FactorBars({ factors }: { factors: FactorResult[] }) {
  return (
    <ul className="space-y-3">
      {factors.map((f) => (
        <li key={f.key}>
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-3">
            <span className="min-w-0 truncate text-sm font-medium text-foreground">{f.label}</span>
            <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
              {f.score}/100 · weight {f.weight}%
            </span>
          </div>
          <div
            className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-secondary"
            role="img"
            aria-label={`${f.label}: ${f.score} out of 100, weighted ${f.weight} percent`}
          >
            <div
              className="h-full rounded-full bg-primary transition-all duration-700"
              style={{ width: `${f.score}%` }}
            />
          </div>
          <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{f.note}</p>
        </li>
      ))}
    </ul>
  );
}
