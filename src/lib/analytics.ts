/**
 * Lightweight analytics hooks. Swap `sink` for a real provider later
 * (PostHog, GA, or a Lovable Cloud table) without touching call sites.
 */
export type AnalyticsEvent =
  | "assessment_started"
  | "step_completed"
  | "assessment_completed"
  | "lead_submitted"
  | "lead_saved"
  | "report_emailed"
  | "consultation_clicked";

export interface TrackedEvent {
  event: AnalyticsEvent;
  payload?: Record<string, unknown> | undefined;
  at: string;
}

const STORE_KEY = "ran.analytics.v1";

export function track(event: AnalyticsEvent, payload?: Record<string, unknown>) {
  const entry: TrackedEvent = { event, payload, at: new Date().toISOString() };
  // eslint-disable-next-line no-console
  console.info("[analytics]", entry.event, payload ?? {});
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    const all: TrackedEvent[] = raw ? JSON.parse(raw) : [];
    all.push(entry);
    window.localStorage.setItem(STORE_KEY, JSON.stringify(all.slice(-200)));
  } catch {
    /* storage unavailable — analytics is non-critical */
  }
}

export function getTrackedEvents(): TrackedEvent[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
