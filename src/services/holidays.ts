import { parseISO, isAfter, startOfDay } from "date-fns";
import type {
  NagerHoliday,
  PublicHoliday,
  AustralianStateCode,
} from "../types/holiday";
import { getNagerCode } from "../utils/states";

const API_BASE = "https://date.nager.at/api/v3/publicholidays";

const cache = new Map<number, PublicHoliday[]>();

async function fetchHolidaysForYear(year: number): Promise<PublicHoliday[]> {
  if (cache.has(year)) return cache.get(year)!;

  const res = await fetch(`${API_BASE}/${year}/AU`);
  if (!res.ok) throw new Error(`Failed to fetch holidays for ${year}`);

  const data: NagerHoliday[] = await res.json();

  const holidays: PublicHoliday[] = data.map((h) => ({
    date: parseISO(h.date),
    name: h.name,
    localName: h.localName,
    global: h.global,
    counties: h.counties ?? [],
  }));

  cache.set(year, holidays);
  return holidays;
}

export async function getHolidaysForState(
  stateCode: AustralianStateCode,
  year: number
): Promise<PublicHoliday[]> {
  const nagerCode = getNagerCode(stateCode);

  // Fetch current year + next year for Dec→Jan transitions
  const [currentYear, nextYear] = await Promise.all([
    fetchHolidaysForYear(year),
    fetchHolidaysForYear(year + 1),
  ]);

  const all = [...currentYear, ...nextYear];

  return all
    .filter((h) => h.global || h.counties.includes(nagerCode))
    .sort((a, b) => a.date.getTime() - b.date.getTime());
}

export async function getUpcomingHolidays(
  stateCode: AustralianStateCode
): Promise<PublicHoliday[]> {
  const now = startOfDay(new Date());
  const year = now.getFullYear();
  const holidays = await getHolidaysForState(stateCode, year);

  return holidays.filter((h) => isAfter(h.date, now) || h.date.getTime() === now.getTime());
}
