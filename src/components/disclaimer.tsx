import { Info } from "lucide-react";

/**
 * Accessible, consistently worded disclaimer. Rendered on the landing page,
 * the questionnaire and the results page.
 */
export function Disclaimer({ compact = false }: { compact?: boolean }) {
  return (
    <aside
      role="note"
      aria-label="Important disclaimer"
      className="rounded-xl border border-border bg-secondary/60 p-4 text-sm text-muted-foreground"
    >
      <div className="flex gap-3">
        <Info className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
        <div className="min-w-0">
          <p className="font-medium text-foreground">Educational information only</p>
          <p className="mt-1 leading-relaxed">
            These results are general and educational. They are not legal, tax, immigration,
            financial, insurance or medical advice, and no outcome is guaranteed. Visa rules, tax
            treatment, costs and healthcare access change frequently and vary by personal
            circumstance
            {compact ? "." : ", nationality and region."}
            {!compact &&
              " Verify everything independently with qualified, licensed professionals before making any decision or commitment."}
          </p>
        </div>
      </div>
    </aside>
  );
}
