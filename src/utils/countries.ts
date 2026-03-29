import type { Country, Region } from "../types/holiday";

const API_BASE = "https://date.nager.at/api/v3";

let countriesCache: Country[] | null = null;

export async function getAvailableCountries(): Promise<Country[]> {
  if (countriesCache) return countriesCache;

  const res = await fetch(`${API_BASE}/AvailableCountries`);
  if (!res.ok) throw new Error("Failed to fetch countries");

  const data: Country[] = await res.json();
  countriesCache = data.sort((a, b) => a.name.localeCompare(b.name));
  return countriesCache;
}

const regionsCache = new Map<string, Region[]>();

/**
 * Extract available regions for a country from its holiday data.
 * Regions are derived from the `counties` field (e.g. "AU-QLD" → "QLD").
 */
export async function getRegionsForCountry(countryCode: string): Promise<Region[]> {
  if (regionsCache.has(countryCode)) return regionsCache.get(countryCode)!;

  const year = new Date().getFullYear();
  const res = await fetch(`${API_BASE}/publicholidays/${year}/${countryCode}`);
  if (!res.ok) return [];

  const data: { counties: string[] | null }[] = await res.json();

  const regionCodes = new Set<string>();
  for (const h of data) {
    if (h.counties) {
      for (const c of h.counties) regionCodes.add(c);
    }
  }

  const regions: Region[] = [...regionCodes].sort().map((code) => ({
    code,
    name: code.replace(`${countryCode}-`, ""),
  }));

  regionsCache.set(countryCode, regions);
  return regions;
}

export function getLocationLabel(countryName: string, regionCode?: string): string {
  if (!regionCode) return countryName;
  const regionShort = regionCode.includes("-")
    ? regionCode.split("-").slice(1).join("-")
    : regionCode;
  return `${regionShort}, ${countryName}`;
}
