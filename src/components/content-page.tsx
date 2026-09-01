import { Link } from "@tanstack/react-router";
import { ArrowRight, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { Disclaimer } from "@/components/disclaimer";
import { DESTINATIONS } from "@/data/destinations";
import { formatMoneyRange } from "@/lib/currency";
import { relatedPages, type ContentPage, type FaqItem } from "@/lib/content-pages";

/** Looks up a city from the shared destination dataset. */
export function city(id: string) {
  const found = DESTINATIONS.find((d) => d.id === id);
  if (!found) throw new Error(`Unknown destination id: ${id}`);
  return found;
}

/** Formats the app's own solo/couple budget range for a city. */
export function soloRange(id: string) {
  const c = city(id);
  return formatMoneyRange(c.budget.solo[0], c.budget.solo[1]);
}

export function coupleRange(id: string) {
  const c = city(id);
  return formatMoneyRange(c.budget.couple[0], c.budget.couple[1]);
}

export function ContentShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader
        action={
          <Button asChild size="sm" className="shrink-0">
            <Link to="/assessment">
              Start free assessment
              <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        }
      />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}

export function ContentHero({
  eyebrow,
  title,
  intro,
}: {
  eyebrow: string;
  title: string;
  intro: React.ReactNode;
}) {
  return (
    <section className="paper-panel border-b border-border/70">
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="display mt-3 text-3xl text-balance sm:text-4xl">{title}</h1>
        <div className="mt-4 space-y-4 text-base leading-relaxed text-muted-foreground">{intro}</div>
      </div>
    </section>
  );
}

export function ContentBody({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl space-y-12 px-4 py-12 sm:px-6 sm:py-16">{children}</div>
  );
}

export function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="display text-2xl">{title}</h2>
      <div className="mt-4 space-y-4 leading-relaxed text-muted-foreground">{children}</div>
    </section>
  );
}

export function SubHeading({ children }: { children: React.ReactNode }) {
  return <h3 className="mt-8 text-base font-semibold text-foreground">{children}</h3>;
}

export function Bullets({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="list-disc space-y-2 pl-5">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}

/** Simple responsive comparison table used across the comparison pages. */
export function CompareTable({
  columns,
  rows,
  caption,
}: {
  columns: string[];
  rows: { label: string; values: React.ReactNode[] }[];
  caption: string;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-[var(--shadow-card)]">
      <table className="w-full min-w-[560px] border-collapse text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b border-border bg-secondary/50">
            <th scope="col" className="p-3 text-left font-semibold">
              Factor
            </th>
            {columns.map((c) => (
              <th key={c} scope="col" className="p-3 text-left font-semibold">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.label} className="border-b border-border last:border-b-0 align-top">
              <th scope="row" className="p-3 text-left font-medium text-foreground">
                {r.label}
              </th>
              {r.values.map((v, i) => (
                <td key={i} className="p-3 text-muted-foreground">
                  {v}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function AssessmentCta({
  label,
  note,
  placement,
}: {
  label: string;
  note: string;
  placement?: string;
}) {
  return (
    <Card className="border-primary/30 bg-primary/5 shadow-[var(--shadow-card)]">
      <CardContent className="pt-6">
        <h2 className="display text-xl">{label}</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{note}</p>
        <Button asChild className="mt-5" data-placement={placement}>
          <Link to="/assessment">
            Start the free assessment
            <ArrowRight aria-hidden="true" />
          </Link>
        </Button>
        <p className="mt-3 text-xs text-muted-foreground">
          Free · no signup · a few minutes · nine questions.
        </p>
      </CardContent>
    </Card>
  );
}

export function Faq({ items }: { items: FaqItem[] }) {
  return (
    <section id="faq" className="scroll-mt-24">
      <h2 className="display text-2xl">Frequently asked questions</h2>
      <Accordion type="single" collapsible className="mt-4">
        {items.map((f, i) => (
          <AccordionItem key={f.q} value={`faq-${i}`}>
            <AccordionTrigger className="text-left text-base">{f.q}</AccordionTrigger>
            <AccordionContent className="leading-relaxed text-muted-foreground">
              {f.a}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}

export function Sources({ items }: { items: { label: string; href: string }[] }) {
  return (
    <section id="sources" className="scroll-mt-24">
      <h2 className="display text-2xl">Sources and further reading</h2>
      <ul className="mt-4 space-y-2 text-sm">
        {items.map((s) => (
          <li key={s.href}>
            <a
              className="focus-ring inline-flex items-start gap-1.5 rounded-sm text-primary underline underline-offset-4"
              href={s.href}
              target="_blank"
              rel="noopener noreferrer nofollow"
            >
              <span>{s.label}</span>
              <ExternalLink className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function RelatedReading({ current }: { current: ContentPage["path"] }) {
  const pages = relatedPages(current, 4);
  return (
    <section id="related" className="scroll-mt-24">
      <h2 className="display text-2xl">Keep reading</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {pages.map((p) => (
          <Card key={p.path} className="h-full shadow-[var(--shadow-card)]">
            <CardContent className="pt-6">
              <h3 className="text-base font-semibold">
                <Link to={p.path} className="focus-ring rounded-sm hover:text-primary">
                  {p.label}
                </Link>
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.blurb}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

export function ContentDisclaimer() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Visa, tax and healthcare rules described here are general summaries that change frequently
        and are applied case by case. Treat every figure as an indicative estimate, check the
        official sources linked below, and confirm your own situation with a qualified
        professional.
      </p>
      <Disclaimer compact />
    </div>
  );
}
