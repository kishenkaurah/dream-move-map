import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Disclaimer } from "@/components/disclaimer";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { DestinationResultCard } from "@/components/destination-result-card";
import { ComparisonTable } from "@/components/comparison-table";
import { LeadCapture } from "@/components/lead-capture";
import {
  clearAssessment,
  loadAssessment,
  saveAssessment,
  unansweredQuestions,
} from "@/lib/assessment-storage";
import { rankDestinations, topMatches } from "@/lib/scoring";
import { toReportMatch } from "@/lib/lead-report";
import { QUESTIONS } from "@/data/questions";
import { REGION_LABELS, regionForCountry, regionFromAnswer } from "@/data/regions";
import { displayCurrency } from "@/lib/scoring";
import { trackOnce } from "@/lib/analytics";


export const Route = createFileRoute("/results")({
  head: () => ({
    meta: [
      { title: "Your Retirement Destination Matches | Retire Abroad Navigator" },
      {
        name: "description",
        content:
          "Your top overseas retirement matches with match percentages, budget ranges, visa complexity, healthcare indicators and a factor-by-factor explanation.",
      },
      { property: "og:title", content: "Your Retirement Destination Matches" },
      {
        property: "og:description",
        content:
          "See which overseas retirement destinations fit your finances and lifestyle, and why.",
      },
    ],
  }),
  component: ResultsPage,
});

function ResultsPage() {
  const navigate = useNavigate();
  const [hydrated, setHydrated] = useState(false);
  const [answers, setAnswers] = useState(() => loadAssessment());

  useEffect(() => {
    setAnswers(loadAssessment());
    setHydrated(true);
  }, []);

  const missingQuestions = useMemo(
    () => unansweredQuestions(answers.answers),
    [answers],
  );
  const complete = missingQuestions.length === 0;

  const allResults = useMemo(
    () => (complete ? rankDestinations(answers.answers) : []),
    [answers, complete],
  );
  const currency = useMemo(() => displayCurrency(answers.answers), [answers]);
  const regionPref = regionFromAnswer(
    typeof answers.answers["region_pref"] === "string"
      ? (answers.answers["region_pref"] as string)
      : undefined,
  );
  const results = useMemo(
    () =>
      regionPref
        ? allResults.filter((r) => regionForCountry(r.destination.country) === regionPref)
        : allResults,
    [allResults, regionPref],
  );
  const outsideRegion = useMemo(
    () =>
      regionPref
        ? allResults.filter((r) => regionForCountry(r.destination.country) !== regionPref)
        : [],
    [allResults, regionPref],
  );
  const [showOutside, setShowOutside] = useState(false);
  const top3 = useMemo(() => topMatches(results, 3), [results]);
  const rest = results.filter((r) => !top3.includes(r));

  function restart() {
    clearAssessment();
    void navigate({ to: "/assessment" });
  }

  function continueAssessment() {
    const firstMissing = missingQuestions[0];
    if (!firstMissing) return;
    const stepIndex = QUESTIONS.findIndex((question) => question.id === firstMissing.id);
    saveAssessment({ ...answers, stepIndex: Math.max(0, stepIndex), completedAt: undefined });
    void navigate({ to: "/assessment" });
  }

  if (!hydrated) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <main className="mx-auto max-w-3xl px-4 py-20 text-center text-muted-foreground sm:px-6">
          Loading your results…
        </main>
      </div>
    );
  }

  if (!complete) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <SiteHeader />
        <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-16 sm:px-6">
          <Card className="shadow-[var(--shadow-card)]">
            <CardContent className="pt-6">
              <h1 className="display text-2xl">Your assessment needs a few answers</h1>
              <p className="mt-3 text-muted-foreground">
                Complete the unanswered questions below and your matches will appear here.
              </p>
              <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-foreground">
                {missingQuestions.map((question) => (
                  <li key={question.id}>{question.title}</li>
                ))}
              </ul>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Button type="button" onClick={continueAssessment}>
                  Continue assessment
                </Button>
                <Button asChild variant="outline">
                  <Link to="/">Back home</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader
        action={
          <Button variant="ghost" size="sm" onClick={restart} className="shrink-0">
            <RotateCcw aria-hidden="true" />
            <span className="hidden sm:inline">Restart assessment</span>
          </Button>
        }
      />

      <main className="flex-1">
        <section className="paper-panel border-b border-border/70">
          <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
            <p className="eyebrow">Your assessment</p>
            <h1 className="display mt-3 text-3xl text-balance sm:text-4xl">
              Your top {top3.length} retirement city matches
            </h1>
            <p className="mt-4 max-w-2xl leading-relaxed text-muted-foreground">
              {regionPref ? `Filtered to ${REGION_LABELS[regionPref]}, ranked ` : "Ranked "}
              against the profile you described, using eight weighted factors. Open the
              breakdown on any card to see precisely how each score was reached — and where a
              destination has a blocking constraint rather than a minor drawback.
            </p>
          </div>
        </section>

        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
          <Tabs defaultValue="matches">
            <TabsList>
              <TabsTrigger value="matches">Top matches</TabsTrigger>
              <TabsTrigger value="compare">Side-by-side</TabsTrigger>
            </TabsList>

            <TabsContent value="matches" className="mt-6 space-y-6">
              {top3.map((r, i) => (
                <DestinationResultCard
                  key={r.destination.id}
                  result={r}
                  rank={i + 1}
                  currency={currency}
                />
              ))}
            </TabsContent>

            <TabsContent value="compare" className="mt-6 space-y-4">
              <ComparisonTable results={top3} currency={currency} />
              <p className="text-xs text-muted-foreground">
                Scores are relative to your answers only. A low score here does not mean a
                destination is a poor place to live.
              </p>
            </TabsContent>
          </Tabs>

          <div className="mt-10 space-y-6">
            <LeadCapture
              matches={top3.map(toReportMatch)}
              {...(regionPref ? { regionPreference: regionPref } : {})}
              answers={
                Object.fromEntries(
                  Object.entries(answers.answers).filter(([, v]) => v !== undefined),
                ) as Record<string, string | string[]>
              }
            />
            <Disclaimer />
            <div className="rounded-xl border border-border bg-card p-5">
              <h2 className="display text-lg">Also scored</h2>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {rest.map((r) => (
                  <li
                    key={r.destination.id}
                    className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-lg border border-border bg-secondary/40 px-3 py-2 text-sm"
                  >
                    <span className="min-w-0 truncate">
                      <span aria-hidden="true">{r.destination.emoji}</span> {r.destination.name},{" "}
                      {r.destination.country}
                    </span>
                    <span className="shrink-0 tabular-nums text-muted-foreground">
                      {r.overall}%
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {regionPref && outsideRegion.length > 0 && (
              <div className="rounded-xl border border-border bg-card p-5">
                {showOutside ? (
                  <>
                    <h2 className="display text-lg">
                      Outside {REGION_LABELS[regionPref]}
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Scored exactly the same way — worth a look before you commit to a region.
                    </p>
                    <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                      {outsideRegion.map((r) => (
                        <li
                          key={r.destination.id}
                          className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-lg border border-border bg-secondary/40 px-3 py-2 text-sm"
                        >
                          <span className="min-w-0 truncate">
                            <span aria-hidden="true">{r.destination.emoji}</span>{" "}
                            {r.destination.name}, {r.destination.country}
                          </span>
                          <span className="shrink-0 tabular-nums text-muted-foreground">
                            {r.overall}%
                          </span>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowOutside(true)}
                    className="focus-ring text-sm underline underline-offset-4"
                  >
                    See how destinations outside {REGION_LABELS[regionPref]} would have scored
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
