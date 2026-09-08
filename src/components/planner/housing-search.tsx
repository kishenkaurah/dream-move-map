import { useState } from "react";
import { Button } from "@/components/ui/button";
import { NumberField } from "./fields";
import { propertySearch } from "@/lib/planner/property-search";
import { cityById, adapterFor } from "@/lib/planner/city-adapters";
import { LOCAL_RATES, formatExact } from "@/lib/planner/fx";
import { scenarioSchema } from "@/lib/planner/storage";
import type { HouseholdProfile, CityScenario } from "@/lib/planner/types";

export function HousingSearch({
  scenario: s,
  profile: p,
}: {
  scenario: CityScenario;
  profile: HouseholdProfile;
}) {
  const city = cityById(s.cityId)!;
  const currency = adapterFor(city.country).localCurrency;
  const [rateOverride, setRateOverride] = useState<number | null>(null);
  const [copyResult, setCopyResult] = useState<{ maximum: number; message: string } | null>(null);
  if (!currency) return null;
  const rate = rateOverride ?? (p.currency === currency ? p.usdRate : LOCAL_RATES[currency]);
  const housing = s.budget.housing * (1 + s.lifestyleAdjustPct / 100);
  const search =
    scenarioSchema.safeParse(s).success &&
    Number.isFinite(p.usdRate) &&
    p.usdRate >= 0.0001 &&
    p.usdRate <= 10000
      ? propertySearch(s.cityId, housing, rate)
      : null;
  return (
    <section
      className="space-y-4 rounded-xl border bg-secondary/40 p-4"
      aria-label="Explore homes within your housing allowance"
    >
      <div>
        <h3 className="text-base font-semibold">Find rentals in {city.name}</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Explore homes in {city.name}, then adjust your allowance using actual asking rents.
        </p>
      </div>
      {search ? (
        <>
          <p className="display text-2xl">
            {new Intl.NumberFormat("en").format(search.maximum)} {currency}
            <span className="text-sm"> / month</span>
          </p>
          <p className="text-sm">
            About {formatExact(housing * p.usdRate, p.currency)} {p.currency} at today's prices,
            including your lifestyle adjustment. This is the full housing allowance; allow room for
            housing charges not included in rent.
          </p>
          <div className="space-y-3 rounded-lg border bg-background p-3">
            <p className="text-sm font-medium">
              1. Copy your maximum monthly rent: {search.maximum.toLocaleString("en")} {currency}
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(String(search.maximum));
                  setCopyResult({
                    maximum: search.maximum,
                    message:
                      "Rent cap copied. Paste it into the maximum-price filter on the property site.",
                  });
                } catch {
                  setCopyResult({
                    maximum: search.maximum,
                    message: `Copy is unavailable in this browser. Enter ${search.maximum.toLocaleString("en")} manually in the maximum-price filter.`,
                  });
                }
              }}
            >
              Copy rent cap
            </Button>
            {copyResult?.maximum === search.maximum && (
              <p role="status" className="text-sm">
                {copyResult.message}
              </p>
            )}
            <p className="text-sm font-medium">2. Open listings and set the maximum-price filter</p>
            <Button asChild variant="outline" className="h-auto w-full whitespace-normal">
              <a href={search.browseUrl} target="_blank" rel="noopener noreferrer">
                Open {city.name} rentals on {search.provider} ↗
              </a>
            </Button>
            {s.cityId === "bangkok" && (
              <a
                className="block text-sm text-primary underline"
                href="https://www.fazwaz.com/property-for-rent/thailand/bangkok"
                target="_blank"
                rel="noopener noreferrer"
              >
                Also browse Bangkok rentals on FazWaz ↗
              </a>
            )}
            <a href={search.browseUrl} className="block text-sm text-primary underline">
              If no new tab opens, open listings in this tab
            </a>
          </div>
          <p className="text-sm text-muted-foreground">
            These links open city listings. Your price cap is not applied automatically, and results
            are not shown inside this planner. Choose monthly rent in {currency}, then check
            bedrooms, neighbourhood, lease length and availability. Keep room for housing charges
            outside rent.
          </p>
        </>
      ) : (
        <p className="text-sm">
          Enter a positive housing allowance and valid exchange rate to see rental searches.
        </p>
      )}
      <details>
        <summary className="cursor-pointer text-sm font-medium">
          Rental-search exchange rate
        </summary>
        <div className="mt-3">
          <NumberField
            label={`1 USD equals how many ${currency}?`}
            value={rate}
            min={0.0001}
            max={10000}
            onChange={(v) => setRateOverride(v ?? Number.NaN)}
            hint="Indicative model rate, not live. This changes the rental-search conversion only. Future inflation, contingency and stress buffers are not added to today's search ceiling."
          />
        </div>
      </details>
    </section>
  );
}
