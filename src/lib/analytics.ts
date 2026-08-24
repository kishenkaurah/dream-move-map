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
  | "consultation_clicked"
  | "landing_cta_clicked"
  | "assessment_viewed"
  | "assessment_progress"
  | "results_viewed";

export interface TrackedEvent {
  event: AnalyticsEvent;
  payload?: Record<string, unknown> | undefined;
  at: string;
}

const STORE_KEY = "ran.analytics.v1";
const ACQUISITION_KEY = "ran.acquisition.v1";
const ONCE_KEY_PREFIX = "ran.analytics.once.";

const UTM_PARAMS = ["utm_source", "utm_medium", "utm_campaign", "utm_content"] as const;

export type Acquisition = Partial<Record<(typeof UTM_PARAMS)[number], string>> & {
  referrer?: string;
};

/**
 * Captures standard UTM parameters and the referrer on first arrival and keeps
 * them for the browser session. Only the four documented UTM keys and the
 * referrer are ever stored — no other URL parameters are read or transmitted.
 */
export function captureAcquisition(): Acquisition {
  if (typeof window === "undefined") return {};
  try {
    const existing = window.sessionStorage.getItem(ACQUISITION_KEY);
    if (existing) return JSON.parse(existing) as Acquisition;

    const params = new URLSearchParams(window.location.search);
    const acquisition: Acquisition = {};
    for (const key of UTM_PARAMS) {
      const value = params.get(key);
      if (value) acquisition[key] = value.slice(0, 120);
    }
    if (document.referrer) {
      try {
        acquisition.referrer = new URL(document.referrer).hostname;
      } catch {
        /* malformed referrer — ignore */
      }
    }
    window.sessionStorage.setItem(ACQUISITION_KEY, JSON.stringify(acquisition));
    return acquisition;
  } catch {
    return {};
  }
}

function acquisition(): Acquisition {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.sessionStorage.getItem(ACQUISITION_KEY);
    return raw ? (JSON.parse(raw) as Acquisition) : captureAcquisition();
  } catch {
    return {};
  }
}

/** Fires an event at most once per browser session for the given key. */
export function trackOnce(
  key: string,
  event: AnalyticsEvent,
  payload?: Record<string, unknown>,
) {
  if (typeof window === "undefined") return;
  try {
    const storeKey = `${ONCE_KEY_PREFIX}${key}`;
    if (window.sessionStorage.getItem(storeKey)) return;
    window.sessionStorage.setItem(storeKey, "1");
  } catch {
    /* storage unavailable — still track */
  }
  track(event, payload);
}


const measurementId =
  import.meta.env["VITE_LOVABLE_CONNECTOR_GOOGLE_ANALYTICS_API_KEY"];

let gaInitialized = false;

type GtagCommand = "js" | "config" | "event";

interface GtagFunction {
  (command: "js", date: Date): void;
  (command: "config", measurementId: string, config?: Record<string, unknown>): void;
  (command: "event", name: string, params?: Record<string, unknown>): void;
  (command: GtagCommand, ...args: unknown[]): void;
}

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: GtagFunction;
  }
}

function ensureGtag(): GtagFunction | undefined {
  if (typeof window === "undefined") return undefined;

  if (!window.gtag) {
    window.dataLayer = window.dataLayer || [];
    const gtag: GtagFunction = (...args: unknown[]) => {
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
  if (typeof window === "undefined") {
    // eslint-disable-next-line no-console
    console.info("[analytics]", event, payload ?? {});
    return;
  }

  const fullPayload = { ...payload, ...acquisition() };
  const entry: TrackedEvent = { event, payload: fullPayload, at: new Date().toISOString() };
  // eslint-disable-next-line no-console
  console.info("[analytics]", entry.event, fullPayload);

  // Source of truth: first-party persistence in the backend.
  void recordEvent(event, fullPayload);

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
    ...fullPayload,
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
