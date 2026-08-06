import { useEffect, useMemo, useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Check, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Disclaimer } from "@/components/disclaimer";
import { SiteHeader } from "@/components/site-chrome";
import {
  DEFAULT_ANSWERS,
  QUESTIONS,
  TOTAL_STEPS,
  optionLabel,
} from "@/data/questions";
import { CURRENCY_NAMES, currencyForCitizenship } from "@/lib/currency";
import {
  clearAssessment,
  loadAssessment,
  saveAssessment,
  type AssessmentState,
} from "@/lib/assessment-storage";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/assessment")({
  head: () => ({
    meta: [
      { title: "Retirement Destination Assessment | Retire Abroad Navigator" },
      {
        name: "description",
        content:
          "Answer a short set of questions about your finances, healthcare needs and lifestyle to see which overseas retirement destinations fit you best.",
      },
      { property: "og:title", content: "Retirement Destination Assessment" },
      {
        property: "og:description",
        content: "A free 10-minute assessment matching your profile to overseas retirement destinations.",
      },
    ],
  }),
  component: AssessmentPage,
});

function AssessmentPage() {
  const navigate = useNavigate();
  const [hydrated, setHydrated] = useState(false);
  const [state, setState] = useState<AssessmentState>({
    answers: { ...DEFAULT_ANSWERS },
    stepIndex: 0,
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loaded = loadAssessment();
    setState({ ...loaded, answers: { ...DEFAULT_ANSWERS, ...loaded.answers } });
    setHydrated(true);
    track("assessment_started", { resumed: Object.keys(loaded.answers).length > 0 });
  }, []);

  useEffect(() => {
    if (hydrated) saveAssessment(state);
  }, [state, hydrated]);

  const index = Math.min(state.stepIndex, TOTAL_STEPS - 1);
  const question = QUESTIONS[index]!;
  const answer = state.answers[question.id];
  const currency = currencyForCitizenship(
    typeof state.answers["citizenship"] === "string"
      ? (state.answers["citizenship"] as string)
      : undefined,
  );
  const progress = useMemo(() => ((index + 1) / TOTAL_STEPS) * 100, [index]);

  function setAnswer(value: string | string[]) {
    setError(null);
    setState((s) => ({ ...s, answers: { ...s.answers, [question.id]: value } }));
  }

  function toggleMulti(optionId: string) {
    const current = Array.isArray(answer) ? answer : [];
    const max = question.maxSelections ?? 99;
    if (current.includes(optionId)) {
      setAnswer(current.filter((x) => x !== optionId));
    } else if (current.length < max) {
      setAnswer([...current, optionId]);
    } else {
      setError(`You can choose up to ${max} options. Deselect one first.`);
    }
  }

  function validate(): boolean {
    if (question.type === "single") {
      if (typeof answer !== "string" || !answer) {
        setError("Please choose an option to continue.");
        return false;
      }
      return true;
    }
    const chosen = Array.isArray(answer) ? answer : [];
    if (chosen.length < (question.minSelections ?? 1)) {
      setError(`Please choose at least ${question.minSelections ?? 1} option.`);
      return false;
    }
    return true;
  }

  function next() {
    if (!validate()) return;
    track("step_completed", { step: index + 1, questionId: question.id });
    if (index === TOTAL_STEPS - 1) {
      const completed = {
        ...state,
        stepIndex: index,
        completedAt: new Date().toISOString(),
      };
      setState(completed);
      saveAssessment(completed);
      track("assessment_completed", { answered: Object.keys(completed.answers).length });
      void navigate({ to: "/results" });
      return;
    }
    setError(null);
    setState((s) => ({ ...s, stepIndex: index + 1 }));
  }

  function back() {
    setError(null);
    if (index === 0) {
      void navigate({ to: "/" });
      return;
    }
    setState((s) => ({ ...s, stepIndex: index - 1 }));
  }

  function restart() {
    clearAssessment();
    setState({ answers: { ...DEFAULT_ANSWERS }, stepIndex: 0 });
    setError(null);
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader
        action={
          <Button variant="ghost" size="sm" onClick={restart} className="shrink-0">
            <RotateCcw aria-hidden="true" />
            <span className="hidden sm:inline">Restart</span>
          </Button>
        }
      />

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-4">
          <p className="eyebrow min-w-0 truncate">
            Question {index + 1} of {TOTAL_STEPS}
          </p>
          <p className="shrink-0 text-xs tabular-nums text-muted-foreground">
            {Math.round(progress)}% complete
          </p>
        </div>
        <Progress
          value={progress}
          className="mt-2 h-1.5"
          aria-label={`Assessment progress: question ${index + 1} of ${TOTAL_STEPS}`}
        />

        <Card className="mt-6 shadow-[var(--shadow-card)]">
          <CardContent className="pt-6">
            <h1 className="display text-2xl text-balance sm:text-[1.75rem]">{question.title}</h1>
            {question.help && (
              <p className="mt-2 text-sm text-muted-foreground">{question.help}</p>
            )}
            {question.money && (
              <p className="mt-2 text-xs text-muted-foreground">
                Amounts shown in {CURRENCY_NAMES[currency]}.
              </p>
            )}

            <div
              role={question.type === "single" ? "radiogroup" : "group"}
              aria-label={question.title}
              className="mt-6 grid gap-2.5"
            >
              {question.options.map((opt) => {
                const selected =
                  question.type === "single"
                    ? answer === opt.id
                    : Array.isArray(answer) && answer.includes(opt.id);
                return (
                  <button
                    key={opt.id}
                    type="button"
                    role={question.type === "single" ? "radio" : "checkbox"}
                    aria-checked={selected}
                    onClick={() =>
                      question.type === "single" ? setAnswer(opt.id) : toggleMulti(opt.id)
                    }
                    className={cn(
                      "focus-ring grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl border px-4 py-3.5 text-left transition-all duration-200",
                      selected
                        ? "border-primary bg-accent/70 shadow-[var(--shadow-card)]"
                        : "border-border bg-card hover:border-primary/40 hover:bg-secondary/60",
                    )}
                  >
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-foreground">
                        {optionLabel(opt, currency)}
                      </span>
                      {opt.hint && (
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          {opt.hint}
                        </span>
                      )}
                    </span>
                    <span
                      aria-hidden="true"
                      className={cn(
                        "grid size-5 shrink-0 place-items-center rounded-full border transition-colors",
                        selected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border",
                      )}
                    >
                      {selected && <Check className="size-3" />}
                    </span>
                  </button>
                );
              })}
            </div>

            {error && (
              <p role="alert" className="mt-4 text-sm text-destructive">
                {error}
              </p>
            )}

            <div className="mt-8 flex items-center justify-between gap-3">
              <Button type="button" variant="ghost" onClick={back}>
                <ArrowLeft aria-hidden="true" />
                Back
              </Button>
              <Button type="button" onClick={next}>
                {index === TOTAL_STEPS - 1 ? "See my results" : "Next"}
                <ArrowRight aria-hidden="true" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6">
          <Disclaimer compact />
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Your answers are saved on this device only.{" "}
          <Link to="/" className="underline underline-offset-2">
            Return home
          </Link>
        </p>
      </main>
    </div>
  );
}
