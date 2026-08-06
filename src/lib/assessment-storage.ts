/**
 * Local persistence for assessment progress and results.
 * Replace these four functions with Lovable Cloud calls when a backend
 * is added — the rest of the app only uses this module's API.
 */
import { QUESTIONS, type Answers } from "@/data/questions";

const KEY = "ran.assessment.v1";
export const ASSESSMENT_VERSION = 2;

export interface AssessmentState {
  version: number;
  answers: Answers;
  stepIndex: number;
  completedAt?: string | undefined;
}

function emptyAssessment(): AssessmentState {
  return { version: ASSESSMENT_VERSION, answers: {}, stepIndex: 0 };
}

export function isQuestionAnswered(questionId: string, answers: Answers): boolean {
  const question = QUESTIONS.find((candidate) => candidate.id === questionId);
  if (!question) return false;

  const value = answers[question.id];
  const validOptionIds = new Set(question.options.map((option) => option.id));
  if (question.type === "single") {
    return typeof value === "string" && validOptionIds.has(value);
  }

  if (!Array.isArray(value)) return false;
  const uniqueValues = new Set(value);
  const minimum = question.minSelections ?? 1;
  const maximum = question.maxSelections ?? Number.POSITIVE_INFINITY;
  return (
    value.length === uniqueValues.size &&
    value.length >= minimum &&
    value.length <= maximum &&
    value.every((optionId) => validOptionIds.has(optionId))
  );
}

export function unansweredQuestions(answers: Answers) {
  return QUESTIONS.filter((question) => !isQuestionAnswered(question.id, answers));
}

export function firstUnansweredStep(answers: Answers): number | null {
  const index = QUESTIONS.findIndex((question) => !isQuestionAnswered(question.id, answers));
  return index === -1 ? null : index;
}

function sanitizeAnswers(value: unknown): Answers {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const candidate = value as Record<string, unknown>;
  const answers: Answers = {};

  for (const question of QUESTIONS) {
    const answer = candidate[question.id];
    const possibleAnswers: Answers = { [question.id]: answer as string | string[] | undefined };
    if (isQuestionAnswered(question.id, possibleAnswers)) {
      answers[question.id] = answer as string | string[];
    }
  }

  return answers;
}

export function loadAssessment(): AssessmentState {
  if (typeof window === "undefined") return emptyAssessment();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return emptyAssessment();
    const parsed = JSON.parse(raw) as Partial<AssessmentState>;
    if (parsed.version !== ASSESSMENT_VERSION) {
      window.localStorage.removeItem(KEY);
      return emptyAssessment();
    }

    const answers = sanitizeAnswers(parsed.answers);
    const firstMissing = firstUnansweredStep(answers);
    const storedStep = Number.isInteger(parsed.stepIndex) ? Number(parsed.stepIndex) : 0;
    const stepIndex = firstMissing ?? Math.max(0, Math.min(storedStep, QUESTIONS.length - 1));
    return {
      version: ASSESSMENT_VERSION,
      answers,
      stepIndex,
      ...(typeof parsed.completedAt === "string" && firstMissing === null
        ? { completedAt: parsed.completedAt }
        : {}),
    };
  } catch {
    return emptyAssessment();
  }
}

export function saveAssessment(state: AssessmentState) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      KEY,
      JSON.stringify({ ...state, version: ASSESSMENT_VERSION }),
    );
  } catch {
    /* ignore */
  }
}

export function clearAssessment() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
}

/**
 * True only when the stored assessment is complete against the CURRENT
 * question set — stale saves from an older question set are ignored.
 */
export function hasCompletedAssessment(state: AssessmentState = loadAssessment()) {
  if (!state.completedAt) return false;
  return unansweredQuestions(state.answers).length === 0;
}
