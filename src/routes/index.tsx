import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  Clock,
  Compass,
  HeartPulse,
  ListOrdered,
  Scale,
  ShieldCheck,
  SlidersHorizontal,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Disclaimer } from "@/components/disclaimer";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { DESTINATIONS } from "@/data/destinations";
import { TOTAL_STEPS } from "@/data/questions";
import { hasCompletedAssessment } from "@/lib/assessment-storage";
import { track } from "@/lib/analytics";
import heroImage from "@/assets/hero-coast.jpg";

const CITY_COUNT = DESTINATIONS.length;
const COUNTRY_COUNT = new Set(DESTINATIONS.map((d) => d.country)).size;

function ctaClicked(placement: string, action: "start" | "resume" = "start") {
  track("landing_cta_clicked", { placement, action });
}

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Retire Abroad Navigator — Find Your Retirement Destination" },
      {
        name: "description",
        content:
          "A free, transparent assessment that matches your finances, lifestyle and priorities to overseas retirement destinations in under 10 minutes.",
      },
      { property: "og:title", content: "Retire Abroad Navigator — Find Your Retirement Destination" },
      {
        property: "og:description",
        content:
          "Answer a few short questions and see which overseas retirement destinations genuinely fit your budget, healthcare needs and lifestyle.",
      },
    ],
  }),
  component: Landing,
});

const STEPS = [
  {
    icon: Compass,
    title: `Answer ${TOTAL_STEPS} short questions`,
    body: "Finances, healthcare, climate, language, family proximity and the lifestyle you want.",
  },
  {
    icon: Scale,
    title: "See a transparent score",
    body: "Every match is broken down factor by factor, so you can see exactly why a place ranked where it did.",
  },
  {
    icon: BadgeCheck,
    title: "Leave with a research plan",
    body: "Budget ranges, visa complexity, honest compromises and the specific questions to investigate next.",
  },
];

const PREVIEW = [
  {
    icon: ListOrdered,
    title: "Ranked city matches",
    body: `Your shortlist from ${CITY_COUNT} cities, each with a fit percentage.`,
    sample: [
      { label: "Coastal city, Portugal", value: "88%" },
      { label: "Northern city, Thailand", value: "84%" },
      { label: "Highland town, Mexico", value: "79%" },
    ],
  },
  {
    icon: Wallet,
    title: "Realistic monthly budgets",
    body: "A typical local range plus what your own answers project you'd spend.",
    sample: [
      { label: "Typical range", value: "$1,700 – $2,600" },
      { label: "Rent", value: "$750" },
      { label: "Everything else", value: "$1,150" },
    ],
  },
  {
    icon: SlidersHorizontal,
    title: "Honest trade-off breakdown",
    body: "Factor-by-factor scoring, including where a destination falls short for you.",
    sample: [
      { label: "Cost of living", value: "High fit" },
      { label: "Healthcare access", value: "Medium fit" },
      { label: "Visa & admin burden", value: "Low fit" },
    ],
  },
];

const TRUST = [
  { icon: Wallet, label: "No cost, no account" },
  { icon: ShieldCheck, label: "Email is optional" },
  { icon: Clock, label: "Under 10 minutes" },
  { icon: HeartPulse, label: "Constraints flagged honestly" },
];


function Landing() {
  const [hasSavedResults, setHasSavedResults] = useState(false);

  useEffect(() => {
    setHasSavedResults(hasCompletedAssessment());
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader
        action={
          <Button asChild size="sm" className="shrink-0">
            <Link to="/assessment" onClick={() => ctaClicked("header")}>
              Find my best destinations
            </Link>
          </Button>
        }
      />

      <main>
        <section className="paper-panel border-b border-border/70">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1.05fr_1fr] lg:items-center">
            <div className="min-w-0">
              <p className="eyebrow">Independent retirement destination guidance</p>
              <h1 className="display mt-4 text-4xl leading-[1.08] text-balance sm:text-5xl">
                Find out where you can afford to retire abroad.
              </h1>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                A free assessment that compares {CITY_COUNT} cities across {COUNTRY_COUNT}{" "}
                countries against your budget, healthcare needs and lifestyle — then explains the
                trade-offs honestly, including where you'd be stretched too thin.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg">
                  <Link to="/assessment" onClick={() => ctaClicked("hero")}>
                    Find my best destinations
                    <ArrowRight aria-hidden="true" />
                  </Link>
                </Button>
                {hasSavedResults && (
                  <Button asChild size="lg" variant="outline">
                    <Link to="/results" onClick={() => ctaClicked("hero_saved_results", "resume")}>
                      View my saved results
                    </Link>
                  </Button>
                )}
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                Independent guidance. No sponsored rankings. No email gate.
              </p>
              <ul className="mt-6 grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:gap-x-6">
                {TRUST.map(({ icon: Icon, label }) => (
                  <li
                    key={label}
                    className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground"
                  >
                    <Icon className="size-4 shrink-0 text-primary" aria-hidden="true" />
                    <span className="min-w-0">{label}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="relative">
              <img
                src={heroImage}
                width={1600}
                height={1104}
                alt="A quiet stone terrace overlooking a Mediterranean coastline at golden hour"
                className="aspect-[4/3] w-full rounded-2xl object-cover shadow-[var(--shadow-lift)]"
              />
              <div className="absolute -bottom-6 left-4 right-4 rounded-xl border border-border bg-card/95 p-4 shadow-[var(--shadow-card)] backdrop-blur sm:left-8 sm:right-8">
                <p className="text-sm text-muted-foreground">
                  Currently scoring{" "}
                  <span className="font-medium text-foreground">{CITY_COUNT} cities</span> across{" "}
                  {COUNTRY_COUNT} countries and 8 weighted factors —{" "}
                  {Array.from(new Set(DESTINATIONS.map((d) => d.country))).join(", ")}.
                </p>
              </div>

            </div>
          </div>
        </section>

        <section
          aria-labelledby="what-you-get"
          className="border-b border-border/70 bg-secondary/30"
        >
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16">
            <div className="max-w-2xl">
              <h2 id="what-you-get" className="display text-2xl sm:text-3xl">
                What you'll get
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Illustrative examples of the output format — not your results. Your own numbers are
                calculated from the {TOTAL_STEPS} questions you answer.
              </p>
            </div>
            <div className="mt-8 grid gap-5 md:grid-cols-3">
              {PREVIEW.map(({ icon: Icon, title, body, sample }) => (
                <Card key={title} className="h-full shadow-[var(--shadow-card)]">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground">
                        <Icon className="size-5" aria-hidden="true" />
                      </span>
                      <h3 className="text-base font-semibold">{title}</h3>
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{body}</p>
                    <p className="eyebrow mt-5">Example output</p>
                    <ul className="mt-2 space-y-1.5" aria-label={`${title} — example output`}>
                      {sample.map((row) => (
                        <li
                          key={row.label}
                          className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-lg border border-dashed border-border bg-background px-3 py-2 text-sm"
                        >
                          <span className="min-w-0 truncate text-muted-foreground">
                            {row.label}
                          </span>
                          <span className="shrink-0 font-medium tabular-nums">{row.value}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="mt-8">
              <Button asChild size="lg">
                <Link to="/assessment" onClick={() => ctaClicked("what_you_get")}>
                  Find my best destinations
                  <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
            </div>
          </div>
        </section>


        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <h2 className="display text-2xl sm:text-3xl">How it works</h2>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {STEPS.map(({ icon: Icon, title, body }, i) => (
              <Card key={title} className="h-full shadow-[var(--shadow-card)]">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground">
                      <Icon className="size-5" aria-hidden="true" />
                    </span>
                    <span className="eyebrow">Step {i + 1}</span>
                  </div>
                  <h3 className="mt-4 text-lg font-semibold">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="border-y border-border/70 bg-secondary/40">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
            <div className="grid gap-10 lg:grid-cols-2">
              <div>
                <h2 className="display text-2xl sm:text-3xl">Built to be honest, not flattering</h2>
                <p className="mt-4 leading-relaxed text-muted-foreground">
                  If your expected income falls below what a destination realistically costs, we say
                  so and cap the score. A blocking budget problem is not a five-point deduction—it's
                  the thing you need to know first.
                </p>
                <p className="mt-4 leading-relaxed text-muted-foreground">
                  Every destination card lists the compromises alongside the advantages, plus the
                  specific questions worth putting to a qualified adviser before you commit.
                </p>
                <Button asChild className="mt-6">
                  <Link to="/assessment">
                    Begin your assessment
                    <ArrowRight aria-hidden="true" />
                  </Link>
                </Button>
              </div>
              <div className="space-y-4">
                <Disclaimer />
                <Card>
                  <CardContent className="pt-6 text-sm text-muted-foreground">
                    <p className="font-medium text-foreground">What we never do</p>
                    <ul className="mt-2 space-y-1.5">
                      <li>• Present visa, tax or medical conclusions as definitive</li>
                      <li>• Require your contact details to see your results</li>
                      <li>• Hide how a score was calculated</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
