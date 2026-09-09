import { LOCAL_RATES } from "./fx";
import { cityById, adapterFor } from "./city-adapters";

/** Rental-area URLs checked 2026-09-08. External filters can change. */
const AREAS: Record<string, { url: string; provider: string; priceFilter: boolean }> = {
  bangkok: {
    url: "https://www.ddproperty.com/en/property-for-rent/in-bangkok-th10",
    provider: "DDproperty",
    priceFilter: false,
  },
  chiang_mai: {
    url: "https://www.ddproperty.com/en/condo-for-rent/in-chiang-mai-th50",
    provider: "DDproperty",
    priceFilter: false,
  },
  hua_hin: {
    url: "https://www.ddproperty.com/en/condo-for-rent/in-hua-hin-th7707",
    provider: "DDproperty",
    priceFilter: false,
  },
  phuket: {
    url: "https://www.ddproperty.com/en/condo-for-rent/in-phuket-th83",
    provider: "DDproperty",
    priceFilter: false,
  },
  penang: {
    url: "https://www.propertyguru.com.my/property-for-rent/in-penang-5qvq6",
    provider: "PropertyGuru",
    priceFilter: false,
  },
  kuala_lumpur: {
    url: "https://www.propertyguru.com.my/property-for-rent/in-kuala-lumpur-58jok",
    provider: "PropertyGuru",
    priceFilter: false,
  },
  kuching: {
    url: "https://www.propertyguru.com.my/property-for-rent/in-kuching-s70ov",
    provider: "PropertyGuru",
    priceFilter: false,
  },
  lisbon: {
    url: "https://www.idealista.pt/arrendar-casas/lisboa/",
    provider: "idealista",
    priceFilter: false,
  },
  porto: {
    url: "https://www.idealista.pt/arrendar-casas/porto/",
    provider: "idealista",
    priceFilter: false,
  },
  algarve: {
    url: "https://www.idealista.pt/arrendar-casas/faro-distrito/",
    provider: "idealista",
    priceFilter: false,
  },
  funchal: {
    url: "https://www.idealista.pt/arrendar-casas/funchal/",
    provider: "idealista",
    priceFilter: false,
  },
};
export function propertySearch(
  cityId: string,
  housingUsd: number,
  localRate?: number,
  bedrooms = 1,
) {
  if (!Number.isInteger(bedrooms) || bedrooms < 1 || bedrooms > 4) return null;
  const area = AREAS[cityId];
  const city = cityById(cityId);
  const currency = city && adapterFor(city.country).localCurrency;
  if (!area || !currency || !Number.isFinite(housingUsd) || housingUsd <= 0) return null;
  const rate = localRate ?? LOCAL_RATES[currency];
  if (!Number.isFinite(rate) || rate <= 0 || rate > 10000) return null;
  const maximum = Math.floor(housingUsd * rate);
  if (maximum < 1) return null;
  // Bangkok's query format was captured from the provider's own controls and
  // opened in a fresh browser tab with price and bedroom filters retained.
  const priceFilter = cityId === "bangkok";
  const url = new URL(priceFilter ? "https://www.ddproperty.com/en/property-for-rent" : area.url);
  if (priceFilter) {
    url.searchParams.set("listingType", "rent");
    url.searchParams.set("page", "1");
    url.searchParams.set("regionCode", "TH10");
    url.searchParams.set("_freetextDisplay", "Bangkok");
    url.searchParams.set("isCommercial", "false");
    url.searchParams.set("maxPrice", String(maximum));
    url.searchParams.set("bedrooms", String(bedrooms));
  }
  return {
    ...area,
    priceFilter,
    bedrooms,
    url: url.href,
    browseUrl: area.url,
    currency,
    rate,
    maximum,
  };
}
