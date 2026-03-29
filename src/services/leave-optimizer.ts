import {
  addDays,
  isWeekend,
  isSameDay,
  format,
  eachDayOfInterval,
} from "date-fns";
import type { PublicHoliday, LeaveBlock } from "../types/holiday";

function isHoliday(date: Date, holidays: PublicHoliday[]): boolean {
  return holidays.some((h) => isSameDay(h.date, date));
}

function isNonWorkDay(date: Date, holidays: PublicHoliday[]): boolean {
  return isWeekend(date) || isHoliday(date, holidays);
}

/**
 * Find the best continuous blocks of days off for a given leave budget.
 *
 * Every day within a returned block is guaranteed to be either a weekend,
 * a public holiday, or a leave day — no uncovered work-day gaps.
 *
 * For each possible number of leave days (1..budget), finds the longest
 * unbroken stretch of days off achievable by spending exactly that many
 * leave days on workdays within the stretch.
 */
export function optimizeLeave(
  holidays: PublicHoliday[],
  leaveDays: number,
  fromDate?: Date
): LeaveBlock[] {
  const start = fromDate ?? new Date();
  const end = addDays(start, 365);
  const allDays = eachDayOfInterval({ start, end });
  const n = allDays.length;

  // Classify each day as work (true) or free (false)
  const isWork = allDays.map((d) => !isNonWorkDay(d, holidays));

  // For each leave-day count k, track the longest continuous block
  const bestForK = new Map<
    number,
    { left: number; right: number; total: number }
  >();

  // O(n²) scan: for every starting day, extend rightward counting workdays.
  // When workdays exceed budget, stop. Record the best block for each k seen.
  for (let i = 0; i < n; i++) {
    let workCount = 0;
    for (let j = i; j < n; j++) {
      if (isWork[j]) workCount++;
      if (workCount > leaveDays) break;
      if (workCount === 0) continue;

      const total = j - i + 1;
      const existing = bestForK.get(workCount);
      if (!existing || total > existing.total) {
        bestForK.set(workCount, { left: i, right: j, total });
      }
    }
  }

  // Build LeaveBlock results sorted by efficiency
  const results: LeaveBlock[] = [];
  for (const [, val] of bestForK) {
    const blockStart = allDays[val.left]!;
    const blockEnd = allDays[val.right]!;

    const leaveDates: Date[] = [];
    for (let i = val.left; i <= val.right; i++) {
      if (isWork[i]) leaveDates.push(allDays[i]!);
    }

    const totalDaysOff = val.total;
    const used = leaveDates.length;
    const efficiency = totalDaysOff / used;
    const includedHolidays = holidays.filter(
      (h) => h.date >= blockStart && h.date <= blockEnd
    );

    const dateRange = `${format(blockStart, "d MMM")} – ${format(blockEnd, "d MMM yyyy")}`;
    const names = includedHolidays.map((h) => h.localName).join(", ");
    const includesStr = names ? `. Includes: ${names}` : "";
    const description = `${dateRange}: Take ${used} day${used > 1 ? "s" : ""} off → ${totalDaysOff} days total (${efficiency.toFixed(1)}x)${includesStr}`;

    results.push({
      startDate: blockStart,
      endDate: blockEnd,
      leaveDaysUsed: used,
      totalDaysOff,
      efficiency,
      leaveDates,
      holidays: includedHolidays,
      description,
    });
  }

  results.sort((a, b) => {
    if (b.efficiency !== a.efficiency) return b.efficiency - a.efficiency;
    return b.totalDaysOff - a.totalDaysOff;
  });

  return results.slice(0, 5);
}
