/**
 * Analytics layer. Ships events to:
 * 1. Google Analytics 4 (if VITE_LOVABLE_CONNECTOR_GOOGLE_ANALYTICS_API_KEY is set)
 * 2. A local console log + localStorage buffer for debugging and fallback.
 *
 * Call sites use the typed `track()` helper and do not need to know which
 * provider is wired up.
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

const measurementId = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_ANALYTICS_API_KEY;

let gaInitialized = false;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: Gtag.Gtag;
  }
}

function ensureGtag() {
  if (typeof window === "undefined") return undefined;

  if (!window.gtag) {
    window.dataLayer = window.dataLayer || [];
    const gtag: Gtag.Gtag = function (...args: unknown[]) {
      window.dataLayer!.push(args);
    };
    window.gtag = gtag;
    gtag("js", new Date());
  }
  return window.gtag;
}

export function initGoogleAnalytics() {
  if (typeof window === "undefined") return;
  if (!measurementId || gaInitialized) return;
  gaInitialized = true;

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script);

  const gtag = ensureGtag();
  gtag?.("config", measurementId);
}

export function trackPageView(path: string) {
  initGoogleAnalytics();
  if (!measurementId) return;

  const gtag = ensureGtag();
  if (!gtag) return;

  gtag("event", "page_view", {
    page_path: path,
    page_location: window.location.href,
    page_title: document.title,
  });
}

export function track(event: AnalyticsEvent, payload?: Record<string, unknown>) {
  const entry: TrackedEvent = { event, payload, at: new Date().toISOString() };
  // eslint-disable-next-line no-console
  console.info("[analytics]", entry.event, payload ?? {});

  if (typeof window === "undefined") return;

  // Local buffer for debugging
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    const all: TrackedEvent[] = raw ? JSON.parse(raw) : [];
    all.push(entry);
    window.localStorage.setItem(STORE_KEY, JSON.stringify(all.slice(-200)));
  } catch {
    /* storage unavailable — analytics is non-critical */
  }

  // GA4
  if (!measurementId) return;
  const gtag = ensureGtag();
  if (!gtag) return;

  gtag("event", event, {
    ...payload,
    event_category: "engagement",
  });
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
