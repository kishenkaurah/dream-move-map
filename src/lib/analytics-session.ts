/**
 * First-party funnel analytics: anonymous session + assessment attempt ids and
 * durable event persistence to the backend (`analytics_events`).
 *
 * No login is required and no questionnaire answer content is ever sent —
 * only event names and funnel metadata.
 */
import { supabase } from "@/integrations/supabase/client";

const SESSION_KEY = "ran.anon_session.v1";
const ATTEMPT_KEY = "ran.assessment_attempt.v1";
const DEDUPE_PREFIX = "ran.funnel.once.";

/** Events that must be counted at most once per assessment attempt. */
export const ONCE_PER_ATTEMPT_EVENTS = new Set([
  "assessment_started",
  "assessment_completed",
  "results_viewed",
]);

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function read(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* storage unavailable — analytics is non-critical */
  }
}

/** Stable anonymous identifier for this browser, created on first use. */
export function anonymousSessionId(): string | null {
  if (typeof window === "undefined") return null;
  const existing = read(SESSION_KEY);
  if (existing) return existing;
  const id = newId();
  write(SESSION_KEY, id);
  return id;
}

/** Current assessment attempt id, creating one if the user is starting fresh. */
export function assessmentAttemptId(): string | null {
  if (typeof window === "undefined") return null;
  const existing = read(ATTEMPT_KEY);
  if (existing) return existing;
  const id = newId();
  write(ATTEMPT_KEY, id);
  return id;
}

/** Called when the user restarts the quiz — starts a brand new attempt. */
export function resetAssessmentAttempt(): string | null {
  if (typeof window === "undefined") return null;
  const id = newId();
  write(ATTEMPT_KEY, id);
  return id;
}

function dedupeKeyFor(event: string, attemptId: string | null): string | null {
  if (!ONCE_PER_ATTEMPT_EVENTS.has(event)) return null;
  return attemptId ? `${attemptId}:${event}` : null;
}

/**
 * Persists a funnel event. Once-per-attempt events are guarded twice:
 * a local marker (fast, offline-safe) and a unique index on
 * (anonymous_session_id, dedupe_key) in the database.
 */
export async function recordEvent(
  event: string,
  metadata?: Record<string, unknown>,
): Promise<void> {
  if (typeof window === "undefined") return;
  const sessionId = anonymousSessionId();
  if (!sessionId) return;

  const attemptId = assessmentAttemptId();
  const dedupeKey = dedupeKeyFor(event, attemptId);

  if (dedupeKey) {
    const marker = `${DEDUPE_PREFIX}${dedupeKey}`;
    if (read(marker)) return;
    write(marker, "1");
  }

  try {
    const { error } = await supabase.from("analytics_events").insert({
      event_name: event.slice(0, 64),
      anonymous_session_id: sessionId,
      assessment_attempt_id: attemptId,
      page: typeof window !== "undefined" ? window.location.pathname.slice(0, 200) : null,
      metadata: (metadata ?? {}) as never,
      dedupe_key: dedupeKey,
    });
    // 23505 = unique violation, i.e. this attempt already logged the event.
    if (error && error.code !== "23505") {
      // eslint-disable-next-line no-console
      console.warn("[analytics] persist failed", error.message);
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn("[analytics] persist failed", err);
  }
}

/** True when this once-per-attempt event has already been recorded locally. */
export function alreadyRecorded(event: string): boolean {
  const key = dedupeKeyFor(event, read(ATTEMPT_KEY));
  if (!key) return false;
  return Boolean(read(`${DEDUPE_PREFIX}${key}`));
}
