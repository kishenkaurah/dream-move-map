import { Button } from "@/components/ui/button";
import { ChoiceField } from "./fields";
import { propertySearch } from "@/lib/planner/property-search";
import { cityById, adapterFor } from "@/lib/planner/city-adapters";
import { LOCAL_RATES } from "@/lib/planner/fx";
import type { HouseholdProfile, CityScenario } from "@/lib/planner/types";
export function HousingSearch({
  scenario: s,
  profile: p,
  onChange,
}: {
  scenario: CityScenario;
  profile: HouseholdProfile;
  onChange: (s: CityScenario) => void;
}) {
  const city = cityById(s.cityId)!;
  const currency = adapterFor(city.country).localCurrency;
  if (!currency) return null;
  const bedrooms = s.rentalBedrooms ?? (p.household === "family" ? 2 : 1);
  const search = propertySearch(
    s.cityId,
    s.budget.housing * (1 + s.lifestyleAdjustPct / 100),
    p.currency === currency ? p.usdRate : LOCAL_RATES[currency],
    bedrooms,
  );
  return (
    <div className="space-y-3 rounded-lg bg-secondary/50 p-3">
      <ChoiceField
        label="Bedrooms"
        value={String(bedrooms)}
        choices={[
          ["1", "1 bedroom"],
          ["2", "2 bedrooms"],
          ["3", "3 bedrooms"],
          ["4", "4 bedrooms"],
        ]}
        onChange={(v) => onChange({ ...s, rentalBedrooms: Number(v) })}
      />
      {search && (
        <>
          <Button asChild variant="outline" className="h-auto w-full whitespace-normal">
            <a href={search.url} target="_blank" rel="noopener noreferrer">
              See homes for {search.maximum.toLocaleString("en")} {currency} / month ↗
            </a>
          </Button>
          <p className="text-xs text-muted-foreground">
            {search.priceFilter
              ? "Opens Bangkok listings with your price and bedroom filters."
              : `Set ${bedrooms} bedrooms and a ${search.maximum.toLocaleString("en")} ${currency} cap on ${search.provider}.`}{" "}
            Exchange rate is indicative.
          </p>
          <a href={search.url} className="text-xs underline">
            Open in this tab instead
          </a>
        </>
      )}
    </div>
  );
}
