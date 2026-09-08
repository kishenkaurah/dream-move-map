import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Download, Save, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { ProfileForm } from "@/components/planner/profile-form";
import { BudgetForm } from "@/components/planner/budget-form";
import { ProjectionView, Metric } from "@/components/planner/projection";
import { ChoiceField } from "@/components/planner/fields";
import { DESTINATIONS } from "@/data/destinations";
import { hasCompletedAssessment, loadAssessment } from "@/lib/assessment-storage";
import { track, trackOnce } from "@/lib/analytics";
import { cityById, isDetailed, seedBudget } from "@/lib/planner/city-adapters";
import { formatExact } from "@/lib/planner/fx";
import { monthlyBudgetUsd, runProjection, validateProfile } from "@/lib/planner/engine";
import { profileFromQuiz, quizShortlist } from "@/lib/planner/quiz-bridge";
import {
  defaultProfile,
  exportPlanJson,
  importPlanJson,
  loadPlan,
  makePlan,
  newScenario,
  savePlan,
  clearPlan,
  MAX_SAVED_SCENARIOS,
} from "@/lib/planner/storage";
import type { CityScenario, HouseholdProfile, SavedPlan } from "@/lib/planner/types";

export const Route = createFileRoute("/planner")({
  validateSearch: (search: Record<string, unknown>) => ({
    city: typeof search["city"] === "string" ? search["city"].slice(0, 100) : "",
  }),
  head: () => ({
    meta: [
      { title: "Retirement Affordability Planner | Retire Abroad" },
      {
        name: "description",
        content:
          "Compare retirement budgets and savings projections across your matched destinations using one financial profile.",
      },
    ],
  }),
  component: PlannerPage,
});

type SavedScenario = SavedPlan["scenarios"][number];
function PlannerPage() {
  const { city: requestedCity } = Route.useSearch();
  const [ready, setReady] = useState(false);
  const [profile, setProfile] = useState<HouseholdProfile>(defaultProfile);
  const [scenario, setScenario] = useState<CityScenario | null>(null);
  const [saved, setSaved] = useState<SavedScenario[]>([]);
  const [cityId, setCityId] = useState("");
  const [shortlist, setShortlist] = useState<ReturnType<typeof quizShortlist>>([]);
  const [name, setName] = useState("");
  const [tab, setTab] = useState("plan");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [dirty, setDirty] = useState(false);
  const [budgetDirty, setBudgetDirty] = useState(false);
  const [interest, setInterest] = useState(false);
  const [confirmation, setConfirmation] = useState<{
    title: string;
    description: string;
    run: () => void;
  } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const assessment = loadAssessment();
    const matches = hasCompletedAssessment(assessment) ? quizShortlist(assessment.answers) : [];
    let stored: SavedPlan | null = null;
    try {
      stored = loadPlan();
    } catch {
      setError(
        "Your saved plan could not be loaded. You can start again or import an exported copy.",
      );
    }
    const p =
      stored?.profile ?? (matches.length ? profileFromQuiz(assessment.answers) : defaultProfile());
    setProfile(p);
    setShortlist(matches);
    setSaved(stored?.scenarios ?? []);
    const id = requestedCity || stored?.draft?.cityId || matches[0]?.destination.id || "";
    const city = cityById(id);
    if (id && !city) setError("That city could not be found. Choose a city below.");
    setCityId(city?.id ?? "");
    const draft =
      city && isDetailed(city.country)
        ? stored?.draft?.cityId === city.id
          ? stored.draft
          : newScenario(city.id, p.household)
        : null;
    setScenario(draft);
    setName(city ? `${city.name} — my plan` : "");
    setReady(true);
    trackOnce("planner-open", "planner_started", {
      source: requestedCity ? "city_result" : matches.length ? "quiz" : "direct",
    });
  }, [requestedCity]);
  useEffect(() => {
    if (!dirty) return;
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);
  const city = cityById(cityId);
  const result = useMemo(
    () => (scenario ? runProjection({ profile, scenario, usdRate: profile.usdRate }) : null),
    [profile, scenario],
  );
  const comparisons = useMemo(
    () =>
      saved.map((entry) => ({
        ...entry,
        result: runProjection({ profile, scenario: entry.scenario, usdRate: profile.usdRate }),
      })),
    [profile, saved],
  );
  const money = (n: number) => formatExact(n, profile.currency);
  const commit = (p: HouseholdProfile, list: SavedScenario[], draft: CityScenario | null) => {
    try {
      savePlan({ profile: p, scenarios: list, draft });
      setDirty(false);
      setError("");
      setMessage("Saved on this device. Export a copy to keep it elsewhere.");
      return true;
    } catch {
      setError(
        "Could not save. Check the inputs or export a copy if browser storage is unavailable.",
      );
      return false;
    }
  };
  const updateProfile = (p: HouseholdProfile) => {
    setProfile(p);
    setDirty(true);
    setMessage("");
    if (p.household !== profile.household)
      setMessage(
        "Household updated. Existing city allowances are unchanged; reset each budget if you want new household defaults.",
      );
    if (p.confirmedByUser && !profile.confirmedByUser && !validateProfile(p).length)
      track("profile_completed");
  };
  const choose = (id: string) => {
    const next = cityById(id);
    if (!next) return;
    setCityId(id);
    setScenario(isDetailed(next.country) ? newScenario(id, profile.household) : null);
    setName(`${next.name} — my plan`);
    setBudgetDirty(false);
    setDirty(true);
    setInterest(false);
    setTab("plan");
  };
  const chooseCity = (id: string) => {
    if (id === cityId) return;
    if (budgetDirty)
      setConfirmation({
        title: "Change city?",
        description:
          "Your unsaved edits to this city budget will be replaced. Saved comparisons will stay.",
        run: () => choose(id),
      });
    else choose(id);
  };
  const saveScenario = (asNew: boolean) => {
    if (!scenario) return;
    if (!name.trim()) {
      setError("Give this scenario a name before saving.");
      return;
    }
    const entry = {
      name: name.trim().slice(0, 60),
      scenario: { ...scenario, id: asNew ? crypto.randomUUID() : scenario.id },
    };
    const exists = saved.some((s) => s.scenario.id === entry.scenario.id);
    const list = exists
      ? saved.map((s) => (s.scenario.id === entry.scenario.id ? entry : s))
      : [...saved, entry];
    if (list.length > MAX_SAVED_SCENARIOS) {
      setError("You can compare three scenarios. Update or remove an existing one first.");
      return;
    }
    if (commit(profile, list, entry.scenario)) {
      setSaved(list);
      setScenario(entry.scenario);
      setBudgetDirty(false);
      track("scenario_saved", { cityId: scenario.cityId });
    }
  };
  const restore = (entry: SavedScenario) => {
    const apply = () => {
      setScenario(entry.scenario);
      setCityId(entry.scenario.cityId);
      setName(entry.name);
      setBudgetDirty(false);
      setTab("plan");
      setDirty(true);
    };
    if (budgetDirty)
      setConfirmation({
        title: "Open saved scenario?",
        description:
          "This replaces unsaved city-budget edits. Your current shared financial profile is kept.",
        run: apply,
      });
    else apply();
  };
  const remove = (id: string) =>
    setConfirmation({
      title: "Remove this comparison?",
      description:
        "The saved scenario will be removed from this device. Exported copies are unaffected.",
      run: () => {
        const list = saved.filter((s) => s.scenario.id !== id);
        if (commit(profile, list, scenario)) setSaved(list);
      },
    });
  const exportFile = () => {
    try {
      const plan = makePlan({ profile, scenarios: saved, draft: scenario });
      const url = URL.createObjectURL(
        new Blob([exportPlanJson(plan)], { type: "application/json" }),
      );
      const a = document.createElement("a");
      a.href = url;
      a.download = "retire-abroad-plan.json";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setError("");
      setMessage(
        "Export downloaded. This file contains your financial inputs; keep it somewhere private.",
      );
    } catch {
      setError("Correct invalid inputs before exporting. Unknown fields can remain blank.");
    }
  };
  const importFile = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > 200000) {
      setError("That file is too large to be a planner export.");
      return;
    }
    let imported: SavedPlan | null = null;
    try {
      imported = importPlanJson(await file.text());
    } catch {
      setError("Could not read the selected file.");
      return;
    }
    if (!imported) {
      setError(
        "This is not a valid current-version planner export. Your existing plan is unchanged.",
      );
      return;
    }
    const plan = imported;
    setConfirmation({
      title: "Import this plan?",
      description:
        "This replaces your current financial profile and saved comparisons on this device.",
      run: () => {
        if (!commit(plan.profile, plan.scenarios, plan.draft)) return;
        setProfile(plan.profile);
        setSaved(plan.scenarios);
        setScenario(plan.draft);
        setCityId(plan.draft?.cityId ?? "");
        setName(plan.draft ? `${cityById(plan.draft.cityId)?.name} — my plan` : "");
        setBudgetDirty(false);
        setTab("plan");
      },
    });
  };
  if (!ready)
    return (
      <div>
        <SiteHeader />
        <main className="mx-auto max-w-6xl px-4 py-12">Loading your planner…</main>
      </div>
    );
  const overseasToday = scenario
    ? (monthlyBudgetUsd(scenario.budget, scenario) * profile.usdRate) /
      (1 - scenario.fxStressPct / 100)
    : null;
  const selectedSaved = scenario && saved.some((s) => s.scenario.id === scenario.id);
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="eyebrow">Affordability planner · Beta</p>
            <h1 className="display mt-2 max-w-3xl text-3xl sm:text-4xl">
              What would your retirement abroad cost?
            </h1>
            <p className="mt-3 max-w-2xl text-muted-foreground">
              One financial profile. Different places to call home. Compare the cost of living and
              what it means for your savings.
            </p>
          </div>
        </div>
        {shortlist.length > 0 && (
          <section aria-label="Your quiz shortlist" className="rounded-xl border bg-card p-4">
            <p className="text-sm font-semibold">From your quiz</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {shortlist.map((r) => (
                <Button
                  key={r.destination.id}
                  variant={cityId === r.destination.id ? "default" : "outline"}
                  onClick={() => chooseCity(r.destination.id)}
                >
                  {r.destination.name}, {r.destination.country}
                </Button>
              ))}
            </div>
          </section>
        )}
        <div className="grid gap-4 rounded-xl border bg-secondary/40 p-4 md:grid-cols-2">
          <ChoiceField
            label="City to plan for"
            value={cityId}
            choices={DESTINATIONS.map(
              (d) =>
                [
                  d.id,
                  `${d.name}, ${d.country}${isDetailed(d.country) ? "" : " · indicative only"}`,
                ] as const,
            )}
            onChange={chooseCity}
          />
          <div className="flex items-center text-sm text-muted-foreground">
            Detailed beta budgets: Thailand, Malaysia and Portugal. Other quiz matches stay visible
            while detailed coverage is developed.
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={() => commit(profile, saved, scenario)}>
            <Save aria-hidden="true" />
            Save plan on this device
          </Button>
          <Button variant="ghost" onClick={exportFile}>
            <Download aria-hidden="true" />
            Export
          </Button>
          <Button variant="ghost" onClick={() => inputRef.current?.click()}>
            <Upload aria-hidden="true" />
            Import
          </Button>
          <input
            ref={inputRef}
            className="hidden"
            type="file"
            accept="application/json,.json"
            aria-label="Import planner file"
            onChange={(e) => {
              void importFile(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
          <span className="text-sm text-muted-foreground">
            {dirty ? "Unsaved changes" : "Device-only storage · no account sync"}
          </span>
        </div>
        {message && (
          <p role="status" className="rounded-lg bg-secondary p-3 text-sm">
            {message}
          </p>
        )}
        {error && (
          <p
            role="alert"
            className="rounded-lg border border-destructive/40 p-3 text-sm text-destructive"
          >
            {error}
          </p>
        )}
        <Tabs
          value={tab}
          onValueChange={(v) => {
            setTab(v);
            if (v === "compare") track("comparison_viewed");
          }}
        >
          <TabsList>
            <TabsTrigger value="plan">Build your plan</TabsTrigger>
            <TabsTrigger value="compare">Compare ({saved.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="plan" className="mt-6">
            <div className="grid min-w-0 items-start gap-6 lg:grid-cols-2">
              <div className="min-w-0 rounded-xl border bg-card px-5">
                <Accordion type="multiple" defaultValue={["profile", "budget"]}>
                  <AccordionItem value="profile">
                    <AccordionTrigger className="display text-xl">
                      1. Your financial profile
                    </AccordionTrigger>
                    <AccordionContent className="pb-6">
                      <ProfileForm profile={profile} scenario={scenario} onChange={updateProfile} />
                    </AccordionContent>
                  </AccordionItem>
                  {scenario && (
                    <AccordionItem value="budget" className="border-b-0">
                      <AccordionTrigger className="display text-xl">
                        2. Life in {city?.name}
                      </AccordionTrigger>
                      <AccordionContent className="pb-6">
                        <BudgetForm
                          scenario={scenario}
                          profile={profile}
                          onChange={(s) => {
                            setScenario(s);
                            setDirty(true);
                            setBudgetDirty(true);
                            setMessage("");
                          }}
                          onReset={() =>
                            setConfirmation({
                              title: "Reset city allowances?",
                              description:
                                "Replace the living-cost lines with indicative defaults for your current household. Setup costs and stress settings are kept.",
                              run: () => {
                                setScenario({
                                  ...scenario,
                                  budget: seedBudget(city!, profile.household),
                                });
                                setDirty(true);
                                setBudgetDirty(true);
                              },
                            })
                          }
                        />
                      </AccordionContent>
                    </AccordionItem>
                  )}
                </Accordion>
              </div>
              <div className="min-w-0 space-y-5">
                {scenario && result ? (
                  <>
                    <div className="flex items-center justify-between">
                      <h2 className="display text-2xl">Your {city?.name} scenario</h2>
                      <span className="text-sm text-muted-foreground">{profile.currency}</span>
                    </div>
                    {result.errors.length > 0 && (
                      <Metric
                        label="Indicative overseas living costs today"
                        value={money(overseasToday ?? 0)}
                      />
                    )}
                    <ProjectionView result={result} profile={profile} />
                    <div className="space-y-3 rounded-xl border bg-card p-5">
                      <Label htmlFor="scenario-name">Name this scenario</Label>
                      <Input
                        id="scenario-name"
                        value={name}
                        maxLength={60}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Hua Hin with two trips home"
                      />
                      <div className="flex flex-wrap gap-2">
                        <Button
                          onClick={() => saveScenario(false)}
                          disabled={!selectedSaved && saved.length >= 3}
                        >
                          {selectedSaved ? "Update saved scenario" : "Save to comparison"}
                        </Button>
                        {selectedSaved && (
                          <Button
                            variant="outline"
                            disabled={saved.length >= 3}
                            onClick={() => saveScenario(true)}
                          >
                            Save as new scenario
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          onClick={() => {
                            setTab("compare");
                            track("comparison_viewed");
                          }}
                        >
                          Compare <ArrowRight aria-hidden="true" />
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Up to three city budgets. Every comparison uses your current shared
                        financial profile and exchange-rate assumption.
                      </p>
                    </div>
                  </>
                ) : city ? (
                  <div className="space-y-4 rounded-xl border bg-card p-6">
                    <h2 className="display text-2xl">
                      {city.name}, {city.country}
                    </h2>
                    <p>Detailed planning coming soon</p>
                    <p className="text-sm text-muted-foreground">
                      Your quiz match is preserved. The existing{" "}
                      {profile.household === "solo" ? "solo" : "couple"} budget range is{" "}
                      {money(
                        (profile.household === "solo" ? city.budget.solo : city.budget.couple)[0] *
                          profile.usdRate,
                      )}
                      –
                      {money(
                        (profile.household === "solo" ? city.budget.solo : city.budget.couple)[1] *
                          profile.usdRate,
                      )}{" "}
                      per month, before your own additional costs. Family needs require separate
                      allowances.
                    </p>
                    <Button
                      variant="outline"
                      disabled={interest}
                      onClick={() => {
                        track("planner_interest", { cityId: city.id, country: city.country });
                        setInterest(true);
                      }}
                    >
                      {interest ? "Thanks for the feedback" : "I'd use a planner for this city"}
                    </Button>
                    <p className="text-sm text-muted-foreground">
                      Choose a supported city above to explore an alternative. Your financial inputs
                      will carry over.
                    </p>
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed p-6">
                    <h2 className="display text-2xl">Choose a city to see its budget</h2>
                    <p className="mt-3 text-muted-foreground">
                      Use the city selector above, or take the free quiz to find your matches.
                    </p>
                    <Button asChild variant="outline" className="mt-4">
                      <Link to="/assessment">Find my destinations</Link>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
          <TabsContent value="compare" className="mt-6 space-y-5">
            <h2 className="display text-2xl">Different destinations. The same finances.</h2>
            <p className="text-sm text-muted-foreground">
              All values are {profile.currency}, calculated from the financial profile you are
              currently editing. Savings projections use the same return, inflation and move-age
              assumptions.
            </p>
            {!saved.length ? (
              <div className="rounded-xl border border-dashed p-6">
                <p>
                  Save a city scenario, then choose another city and save its budget to compare.
                </p>
                <Button className="mt-4" onClick={() => setTab("plan")}>
                  Build your first scenario
                </Button>
              </div>
            ) : (
              <>
                <Table>
                  <caption className="sr-only">Saved retirement affordability scenarios</caption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Comparison</TableHead>
                      {comparisons.map((c) => (
                        <TableHead key={c.scenario.id} className="min-w-40">
                          <span className="break-words text-foreground">{c.name}</span>
                          <span className="block font-normal">
                            {cityById(c.scenario.cityId)?.name}
                          </span>
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(
                      [
                        [
                          "Monthly spending at move",
                          (r: ReturnType<typeof runProjection>) => money(r.monthlySpendingAtMove),
                        ],
                        [
                          "Recurring income at move",
                          (r: ReturnType<typeof runProjection>) => money(r.monthlyIncomeAtMove),
                        ],
                        [
                          "Savings allowance / month",
                          (r: ReturnType<typeof runProjection>) =>
                            money(r.monthlySavingsAllowanceAtMove),
                        ],
                        [
                          "Total spending power / month",
                          (r: ReturnType<typeof runProjection>) =>
                            money(r.monthlySpendingPowerAtMove),
                        ],
                        [
                          "Needed from savings / month",
                          (r: ReturnType<typeof runProjection>) => money(r.monthlyGapAtMove),
                        ],
                        [
                          "Setup expenses",
                          (r: ReturnType<typeof runProjection>) => money(r.setupCost),
                        ],
                        [
                          "Deposits and visa funds",
                          (r: ReturnType<typeof runProjection>) => money(r.restrictedAtMove),
                        ],
                        [
                          "First unfunded expense",
                          (r: ReturnType<typeof runProjection>) =>
                            r.setupShortfall > 0
                              ? "Move not funded"
                              : r.firstShortfallAge === null
                                ? "None in projection"
                                : `Age ${r.firstShortfallAge.toFixed(1)}`,
                        ],
                        [
                          "Final accessible balance",
                          (r: ReturnType<typeof runProjection>) =>
                            r.setupShortfall > 0 ? "Projection stopped" : money(r.finalAccessible),
                        ],
                        [
                          "Assumptions to check",
                          (r: ReturnType<typeof runProjection>) =>
                            `${r.unknowns.length} — open scenario`,
                        ],
                      ] as const
                    ).map(([label, render]) => (
                      <TableRow key={label}>
                        <TableCell className="font-medium">{label}</TableCell>
                        {comparisons.map((c) => (
                          <TableCell key={c.scenario.id}>
                            {c.result.errors.length
                              ? "Complete financial profile"
                              : render(c.result)}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell>Manage</TableCell>
                      {comparisons.map((c) => (
                        <TableCell key={c.scenario.id}>
                          <div className="flex flex-wrap gap-2">
                            <Button variant="outline" size="sm" onClick={() => restore(c)}>
                              Open
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => remove(c.scenario.id)}>
                              Remove
                            </Button>
                          </div>
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableBody>
                </Table>
                {saved.length < 3 && (
                  <Button variant="outline" onClick={() => setTab("plan")}>
                    Add another city scenario
                  </Button>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
        <div className="flex flex-wrap items-center justify-between gap-4 border-t pt-5">
          <p className="max-w-3xl text-sm text-muted-foreground">
            Educational estimates, not financial, tax, visa or insurance advice. Budgets and
            exchange rates are indicative, not live. Plans stay in this browser unless you export
            them. Financial amounts are not included in planner analytics.
          </p>
          <Button
            variant="ghost"
            onClick={() =>
              setConfirmation({
                title: "Clear your saved planner?",
                description:
                  "This removes your financial profile and comparisons from this device. Your quiz results and exported files remain.",
                run: () => {
                  try {
                    clearPlan();
                    setProfile(defaultProfile());
                    setScenario(null);
                    setSaved([]);
                    setCityId("");
                    setName("");
                    setDirty(false);
                    setBudgetDirty(false);
                    setMessage("Planner cleared on this device.");
                    setError("");
                  } catch {
                    setError("Could not clear browser storage.");
                  }
                },
              })
            }
          >
            Clear planner
          </Button>
        </div>
        <AlertDialog
          open={confirmation !== null}
          onOpenChange={(open) => {
            if (!open) setConfirmation(null);
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{confirmation?.title}</AlertDialogTitle>
              <AlertDialogDescription>{confirmation?.description}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  const action = confirmation?.run;
                  setConfirmation(null);
                  action?.();
                }}
              >
                Continue
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
      <SiteFooter />
    </div>
  );
}
