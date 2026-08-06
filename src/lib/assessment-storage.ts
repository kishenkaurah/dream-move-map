/**
 * Local persistence for assessment progress and results.
 * Replace these four functions with Lovable Cloud calls when a backend
 * is added — the rest of the app only uses this module's API.
 */
import { QUESTIONS, type Answers } from "@/data/questions";

const KEY = "ran.assessment.v1";

export interface AssessmentState {
  answers: Answers;
  stepIndex: number;
  completedAt?: string | undefined;
}

const EMPTY: AssessmentState = { answers: {}, stepIndex: 0 };

export function loadAssessment(): AssessmentState {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as AssessmentState;
    return { ...EMPTY, ...parsed };
  } catch {
    return EMPTY;
  }
}

export function saveAssessment(state: AssessmentState) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
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
  return QUESTIONS.every((q) => {
    const v = state.answers[q.id];
    return Array.isArray(v) ? v.length > 0 : Boolean(v);
  });
}
