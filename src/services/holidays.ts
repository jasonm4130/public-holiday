import { parseISO, isAfter, startOfDay } from "date-fns";
import type { NagerHoliday, PublicHoliday } from "../types/holiday";

const API_BASE = "https://date.nager.at/api/v3/publicholidays";

// Cache keyed by "countryCode-year"
const cache = new Map<string, PublicHoliday[]>();

async function fetchHolidaysForYear(countryCode: string, year: number): Promise<PublicHoliday[]> {
  const key = `${countryCode}-${year}`;
  if (cache.has(key)) return cache.get(key)!;

  const res = await fetch(`${API_BASE}/${year}/${countryCode}`);
  if (!res.ok) throw new Error(`Failed to fetch holidays for ${countryCode} ${year}`);

  const data: NagerHoliday[] = await res.json();

  const holidays: PublicHoliday[] = data.map((h) => ({
    date: parseISO(h.date),
    name: h.name,
    localName: h.localName,
    global: h.global,
    counties: h.counties ?? [],
  }));

  cache.set(key, holidays);
  return holidays;
}

export async function getHolidaysForLocation(
  countryCode: string,
  year: number,
  regionCode?: string,
): Promise<PublicHoliday[]> {
  // Fetch current year + next year for Dec→Jan transitions
  const [currentYear, nextYear] = await Promise.all([
    fetchHolidaysForYear(countryCode, year),
    fetchHolidaysForYear(countryCode, year + 1),
  ]);

  const all = [...currentYear, ...nextYear];

  if (!regionCode) {
    // No region → return all holidays for the country
    return all.sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  return all
    .filter((h) => h.global || h.counties.includes(regionCode))
    .sort((a, b) => a.date.getTime() - b.date.getTime());
}

export async function getUpcomingHolidays(
  countryCode: string,
  regionCode?: string,
): Promise<PublicHoliday[]> {
  const now = startOfDay(new Date());
  const year = now.getFullYear();
  const holidays = await getHolidaysForLocation(countryCode, year, regionCode);

  return holidays.filter((h) => isAfter(h.date, now) || h.date.getTime() === now.getTime());
}
