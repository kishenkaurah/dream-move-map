import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  Clock,
  Compass,
  HeartPulse,
  Scale,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Disclaimer } from "@/components/disclaimer";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { DESTINATIONS } from "@/data/destinations";
import { hasCompletedAssessment } from "@/lib/assessment-storage";
import heroImage from "@/assets/hero-coast.jpg";

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
    title: "Answer 14 short questions",
    body: "Finances, healthcare, climate, language, family proximity and how much paperwork you can stomach.",
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

const TRUST = [
  { icon: Wallet, label: "No cost, no account" },
  { icon: ShieldCheck, label: "Email is optional" },
  { icon: Clock, label: "Under 10 minutes" },
  { icon: HeartPulse, label: "Constraints flagged honestly" },
];

function Landing() {
  const [hasSavedResults, setHasSavedResults] = useState(false);

  useEffect(() => {
    setHasSavedResults(Boolean(loadAssessment().completedAt));
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader
        action={
          <Button asChild size="sm" className="shrink-0">
            <Link to="/assessment">Start free assessment</Link>
          </Button>
        }
      />

      <main>
        <section className="paper-panel border-b border-border/70">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1.05fr_1fr] lg:items-center">
            <div className="min-w-0">
              <p className="eyebrow">Independent retirement destination guidance</p>
              <h1 className="display mt-4 text-4xl leading-[1.08] text-balance sm:text-5xl">
                Discover the overseas retirement destinations that fit your finances, lifestyle and
                priorities—in under 10 minutes.
              </h1>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                Most "best places to retire" lists are written for nobody in particular. This
                assessment scores real destinations against your income, your healthcare needs and
                your tolerance for change—and tells you plainly where you'd be stretched too thin.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg">
                  <Link to="/assessment">
                    Start free assessment
                    <ArrowRight aria-hidden="true" />
                  </Link>
                </Button>
                {hasSavedResults && (
                  <Button asChild size="lg" variant="outline">
                    <Link to="/results">View my saved results</Link>
                  </Button>
                )}
              </div>
              <ul className="mt-8 grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:gap-x-6">
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
                  <span className="font-medium text-foreground">
                    {DESTINATIONS.length} cities
                  </span>{" "}
                  across {new Set(DESTINATIONS.map((d) => d.country)).size} countries and 8 weighted
                  factors — {Array.from(new Set(DESTINATIONS.map((d) => d.country))).join(", ")}.

                </p>
              </div>

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
