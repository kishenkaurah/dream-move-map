import { AlertTriangle, Check, Minus, Stamp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { FactorBars } from "@/components/factor-bars";
import type { DestinationResult } from "@/lib/scoring";
import { formatMoney, type CurrencyCode } from "@/lib/currency";

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-secondary/40 p-3">
      <dt className="text-[11px] tracking-wide text-muted-foreground uppercase">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-foreground">{value}</dd>
    </div>
  );
}

export function visaComplexityLabel(n: number) {
  return ["Very simple", "Simple", "Moderate", "Complex", "Very complex"][n - 1] ?? "Moderate";
}

export function healthcareLabel(n: number) {
  return ["Limited", "Basic", "Adequate", "Strong", "Excellent"][n - 1] ?? "Adequate";
}

export function DestinationResultCard({
  result,
  rank,
  currency = "USD",
}: {
  result: DestinationResult;
  rank: number;
  currency?: CurrencyCode;
}) {
  const d = result.destination;
  const [low, high] = result.budgetRange;

  return (
    <Card className="overflow-hidden shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-lift)]">
      <CardHeader className="paper-panel gap-4 border-b border-border/70 pb-5">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="eyebrow">Match #{rank}</span>
            </div>
            <h3 className="display mt-1 flex min-w-0 items-center gap-2 text-2xl">
              <span aria-hidden="true">{d.emoji}</span>
              <span className="truncate">{d.name}</span>
            </h3>
            <p className="mt-0.5 text-xs tracking-wide text-muted-foreground uppercase">
              {d.country}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{d.tagline}</p>
          </div>
          <div className="shrink-0 text-right">
            <div className="display text-3xl tabular-nums text-primary">{result.overall}%</div>
            <div className="text-[11px] tracking-wide text-muted-foreground uppercase">match</div>
          </div>
        </div>
        <p className="text-sm leading-relaxed text-foreground">{result.headline}</p>
      </CardHeader>

      <CardContent className="space-y-5 pt-5">
        {result.constraints.length > 0 && (
          <div
            role="alert"
            className="rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm"
          >
            <p className="flex items-center gap-2 font-medium text-warning-foreground">
              <AlertTriangle className="size-4 shrink-0" aria-hidden="true" />
              Constraints to resolve
            </p>
            <ul className="mt-2 space-y-1.5 text-warning-foreground/90">
              {result.constraints.map((c) => (
                <li key={c} className="leading-relaxed">
                  {c}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="rounded-lg border border-border bg-secondary/40 p-4">
          <p className="text-[11px] tracking-wide text-muted-foreground uppercase">
            {result.projectedSpend !== null
              ? "Your projected monthly spend"
              : "Typical monthly budget"}
          </p>
          <p className="display mt-1 text-2xl tabular-nums text-foreground">
            {result.projectedSpend !== null
              ? `${formatMoney(result.projectedSpend, currency)} / month`
              : `${formatMoney(low, currency)} – ${formatMoney(high, currency)} / month`}
          </p>
          {result.projectedSpend !== null && (
            <p className="mt-1 text-xs text-muted-foreground">
              Typical range here for a {result.household.label}: {formatMoney(low, currency)} –{" "}
              {formatMoney(high, currency)}
            </p>
          )}
        </div>

        <dl className="grid grid-cols-2 gap-3">
          <Stat label="Visa complexity" value={visaComplexityLabel(d.visa.complexity)} />
          <Stat
            label="Healthcare"
            value={`${healthcareLabel(d.healthcare.rating)} (${d.healthcare.rating}/5)`}
          />
        </dl>



        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <h4 className="text-sm font-semibold text-foreground">Key advantages</h4>
            <ul className="mt-2 space-y-1.5">
              {d.advantages.slice(0, 4).map((a) => (
                <li key={a} className="flex gap-2 text-sm text-muted-foreground">
                  <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />
                  <span>{a}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground">Key compromises</h4>
            <ul className="mt-2 space-y-1.5">
              {d.compromises.slice(0, 4).map((c) => (
                <li key={c} className="flex gap-2 text-sm text-muted-foreground">
                  <Minus
                    className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <span>{c}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <Accordion type="single" collapsible className="rounded-lg border border-border px-3">
          <AccordionItem value="spend">
            <AccordionTrigger className="text-sm font-semibold">
              Where the money goes — monthly breakdown
            </AccordionTrigger>
            <AccordionContent className="pb-4">
              <ul className="space-y-2">
                {result.breakdown.map((c) => (
                  <li key={c.label}>
                    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-3">
                      <span className="min-w-0 truncate text-sm text-foreground">{c.label}</span>
                      <span className="shrink-0 text-sm tabular-nums text-muted-foreground">
                        {formatMoney(c.amount, currency)} · {c.share}%
                      </span>
                    </div>
                    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                      <div
                        className="h-full rounded-full bg-primary/70"
                        style={{ width: `${Math.min(100, c.share * 2.5)}%` }}
                      />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{c.hint}</p>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-xs text-muted-foreground">
                An indicative split of{" "}
                {result.projectedSpend !== null
                  ? `your projected ${formatMoney(result.projectedSpend, currency)}`
                  : "a typical budget"}{" "}
                per month for a {result.household.label}. Housing choices and healthcare cover move
                these figures most.
              </p>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="why" className="border-b-0">
            <AccordionTrigger className="text-sm font-semibold">
              Why this matched — factor breakdown
            </AccordionTrigger>
            <AccordionContent className="pb-4">
              <FactorBars factors={result.factors} />
              <p className="mt-4 text-xs text-muted-foreground">
                Scores come from a transparent rules engine. Weights adjust to the priorities you
                selected, so two people can see very different results for the same destination.
              </p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <div>
          <h4 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Stamp className="size-4 text-primary" aria-hidden="true" />
            Visa routes you could use
          </h4>
          <ul className="mt-3 space-y-3">
            {result.visaOptions.map((v) => (
              <li key={v.id} className="rounded-lg border border-border bg-secondary/30 p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-foreground">{v.name}</span>
                  <Badge variant="outline" className="font-normal">
                    {v.typeLabel}
                  </Badge>
                  <Badge
                    variant={v.eligibility === "likely" ? "default" : "secondary"}
                    className="font-normal"
                  >
                    {v.eligibility === "likely"
                      ? "Likely a fit"
                      : v.eligibility === "possible"
                        ? "Possible"
                        : "Unlikely for now"}
                  </Badge>
                </div>
                <p className="mt-1.5 text-sm text-muted-foreground">{v.note}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {v.incomeGuide > 0
                    ? `Income guidance around ${formatMoney(v.incomeGuide, currency)}/month${v.reason ? ` — ${v.reason}` : ""}.`
                    : `${v.reason.charAt(0).toUpperCase()}${v.reason.slice(1)}.`}
                </p>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-muted-foreground">{d.visa.note}</p>
        </div>


        <Badge variant="secondary" className="font-normal">
          Verify all visa, tax and healthcare details independently
        </Badge>
      </CardContent>
    </Card>
  );
}
