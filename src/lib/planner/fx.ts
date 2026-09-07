/**
 * Currency handling for the planner.
 *
 * The planner never uses `formatMoney`/`niceRound` from src/lib/currency.ts —
 * those round to the nearest 50/100/500, which is fine for coarse quiz output
 * and wrong for arithmetic the user is checking. Everything here is exact.
 *
 * Exchange rates are INDICATIVE and NOT live. Their provenance is recorded in
 * `RATE_METADATA` and surfaced in the UI; the user can override the USD → home
 * currency rate on the planner.
 */
import { RATES, SYMBOLS, type CurrencyCode } from "@/lib/currency";

export type LocalCurrencyCode = "THB" | "MYR" | "EUR";

/** Units per 1 USD. Indicative only — see RATE_METADATA. */
export const LOCAL_RATES: Record<LocalCurrencyCode, number> = {
  THB: 33,
  MYR: 4.4,
  EUR: 0.92,
};

export const RATE_METADATA = {
  source: "Indicative model rates entered by hand, not a live feed.",
  /** We do not know a verified capture date, so we do not stamp one. */
  checkedOn: null as string | null,
  status: "indicative" as const,
};

export function usdRateFor(currency: CurrencyCode): number {
  return RATES[currency];
}

/** Converts USD → home currency at the given rate (override-aware). */
export function fromUsd(usd: number, rate: number): number {
  return usd * rate;
}

/**
 * FX stress: the home currency buys `pct`% less overseas, so the same foreign
 * cost takes 1 / (1 - pct) as much home currency. Applied to overseas costs
 * only — never to home-currency income or home-country expenses.
 */
export function fxStressMultiplier(pct: number): number {
  const p = Math.min(Math.max(pct, 0), 90) / 100;
  return 1 / (1 - p);
}

const formatters = new Map<string, Intl.NumberFormat>();

function formatter(currency: string, decimals: number) {
  const key = `${currency}:${decimals}`;
  let f = formatters.get(key);
  if (!f) {
    f = new Intl.NumberFormat("en-AU", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
    formatters.set(key, f);
  }
  return f;
}

/** Exact currency formatting — no bracket rounding of any kind. */
export function formatExact(
  amount: number,
  currency: CurrencyCode | LocalCurrencyCode,
  decimals = 0,
): string {
  if (!Number.isFinite(amount)) return "—";
  const symbol = (SYMBOLS as Record<string, string>)[currency] ?? "";
  const sign = amount < 0 ? "-" : "";
  const body = formatter(currency, decimals).format(Math.abs(amount));
  return symbol ? `${sign}${symbol}${body}` : `${sign}${body} ${currency}`;
}

export function formatLocal(usd: number, code: LocalCurrencyCode): string {
  const value = usd * LOCAL_RATES[code];
  const rounded = Math.round(value);
  return `${new Intl.NumberFormat("en-AU").format(rounded)} ${code}`;
}
