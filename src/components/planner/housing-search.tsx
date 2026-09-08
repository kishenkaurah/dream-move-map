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
        <h3 className="text-base font-semibold">What could your housing budget get you?</h3>
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
          <Button asChild variant="outline" className="h-auto whitespace-normal">
            <a href={search.url} target="_blank" rel="noreferrer">
              {search.priceFilter
                ? `Search rentals up to ${search.maximum.toLocaleString("en")} ${currency}`
                : `Browse ${city.name} rentals on ${search.provider}`}
            </a>
          </Button>
          <p className="text-sm text-muted-foreground">
            {search.priceFilter
              ? "The link requests your maximum price. Confirm that the filter is applied when the site opens."
              : `Set the maximum monthly rent to ${search.maximum.toLocaleString("en")} ${currency} on ${search.provider}; this link selects the area only.`}{" "}
            Check bedrooms, floor area, neighbourhood and lease duration. Listings may be seasonal,
            duplicated or no longer available.
          </p>
          {search.priceFilter && (
            <a
              href={search.browseUrl}
              target="_blank"
              rel="noreferrer"
              className="block text-sm text-primary underline"
            >
              Browse all {city.name} rentals if the price filter does not open
            </a>
          )}
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
