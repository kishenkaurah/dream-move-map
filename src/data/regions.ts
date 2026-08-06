/**
 * REGION CONFIGURATION
 * --------------------
 * Regions are a display filter only — they never affect scoring. Map each
 * country in src/data/destinations.ts to exactly one region here.
 */

export type RegionId = "sea" | "europe" | "latam";

export const REGION_LABELS: Record<RegionId, string> = {
  sea: "Southeast Asia",
  europe: "Europe & Mediterranean",
  latam: "Latin America",
};

export const REGION_BY_COUNTRY: Record<string, RegionId> = {
  Thailand: "sea",
  Malaysia: "sea",
  Vietnam: "sea",
  Portugal: "europe",
  Spain: "europe",
  Greece: "europe",
  "Costa Rica": "latam",
  Mexico: "latam",
  Panama: "latam",
  Colombia: "latam",
};

export function regionForCountry(country: string): RegionId | undefined {
  return REGION_BY_COUNTRY[country];
}

/** Answer id from the "region in mind" question → region filter, or null for all. */
export function regionFromAnswer(answer: string | undefined): RegionId | null {
  if (answer === "sea" || answer === "europe" || answer === "latam") return answer;
  return null;
}
