/**
 * CURRENCY CONFIGURATION
 * ----------------------
 * All scoring and stored data are in USD. This module is the single place that
 * converts USD into the user's display currency, chosen from their citizenship.
 * Update RATES here when you want fresher numbers — nothing else needs editing.
 */

export type CurrencyCode = "USD" | "GBP" | "EUR" | "AUD";

/** Units of the currency per 1 USD. */
export const RATES: Record<CurrencyCode, number> = {
  USD: 1,
  GBP: 0.79,
  EUR: 0.92,
  AUD: 1.52,
};

export const SYMBOLS: Record<CurrencyCode, string> = {
  USD: "$",
  GBP: "£",
  EUR: "€",
  AUD: "A$",
};

export const CURRENCY_NAMES: Record<CurrencyCode, string> = {
  USD: "US dollars",
  GBP: "pounds sterling",
  EUR: "euros",
  AUD: "Australian dollars",
};

/** Citizenship answer id → display currency. */
export const CURRENCY_BY_CITIZENSHIP: Record<string, CurrencyCode> = {
  us_canada: "USD",
  uk: "GBP",
  eu: "EUR",
  australia_nz: "AUD",
  other: "USD",
};

export function currencyForCitizenship(citizenship: string | undefined): CurrencyCode {
  return CURRENCY_BY_CITIZENSHIP[citizenship ?? ""] ?? "USD";
}

/** Rounds a converted figure to a clean, human bracket-friendly number. */
export function niceRound(n: number): number {
  const step = n < 6000 ? 50 : n < 20000 ? 100 : 500;
  return Math.round(n / step) * step;
}

export function convert(usd: number, code: CurrencyCode): number {
  return niceRound(usd * RATES[code]);
}

/** Formats a USD amount in the display currency, rounded to clean numbers. */
export function formatMoney(usd: number, code: CurrencyCode = "USD"): string {
  return `${SYMBOLS[code]}${convert(usd, code).toLocaleString("en-US")}`;
}

export function formatMoneyRange(
  lowUsd: number,
  highUsd: number,
  code: CurrencyCode = "USD",
): string {
  return `${formatMoney(lowUsd, code)} – ${formatMoney(highUsd, code)}`;
}
