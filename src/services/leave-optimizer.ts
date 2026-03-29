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
 * Use ALL available leave days for maximum consecutive time off.
 *
 * Single block (default): finds the longest unbroken stretch achievable
 * by spending exactly `leaveDays` workdays as leave.
 *
 * Multiple blocks: distributes leave across N non-overlapping blocks,
 * each maximising consecutive days off.
 */
export function optimizeLeave(
  holidays: PublicHoliday[],
  leaveDays: number,
  fromDate?: Date,
  numberOfBlocks: number = 1
): LeaveBlock[] {
  const start = fromDate ?? new Date();
  const end = addDays(start, 365);
  const allDays = eachDayOfInterval({ start, end });
  const n = allDays.length;

  // Classify each day as work (true) or free (false)
  const isWork = allDays.map((d) => !isNonWorkDay(d, holidays));

  if (numberOfBlocks <= 1) {
    return findSingleBlock(allDays, isWork, holidays, leaveDays, n);
  }
  return findMultipleBlocks(allDays, isWork, holidays, leaveDays, numberOfBlocks, n);
}

/** Find the single longest block using exactly `budget` leave days. */
function findSingleBlock(
  allDays: Date[],
  isWork: boolean[],
  holidays: PublicHoliday[],
  budget: number,
  n: number
): LeaveBlock[] {
  let bestLeft = -1;
  let bestRight = -1;
  let bestTotal = 0;

  for (let i = 0; i < n; i++) {
    let workCount = 0;
    for (let j = i; j < n; j++) {
      if (isWork[j]) workCount++;
      if (workCount > budget) break;
      if (workCount === budget) {
        const total = j - i + 1;
        if (total > bestTotal) {
          bestTotal = total;
          bestLeft = i;
          bestRight = j;
        }
      }
    }
  }

  if (bestLeft === -1) return [];
  return [buildLeaveBlock(allDays, isWork, holidays, bestLeft, bestRight)];
}

/** Distribute leave across N non-overlapping blocks. */
function findMultipleBlocks(
  allDays: Date[],
  isWork: boolean[],
  holidays: PublicHoliday[],
  budget: number,
  numBlocks: number,
  n: number
): LeaveBlock[] {
  const results: LeaveBlock[] = [];
  const blocked = new Array<boolean>(n).fill(false);
  let remaining = budget;

  for (let b = 0; b < numBlocks && remaining > 0; b++) {
    const blocksLeft = numBlocks - b;
    const budgetForThis = Math.ceil(remaining / blocksLeft);

    let bestLeft = -1;
    let bestRight = -1;
    let bestTotal = 0;

    for (let i = 0; i < n; i++) {
      if (blocked[i]) continue;
      let workCount = 0;
      for (let j = i; j < n; j++) {
        if (blocked[j]) break;
        if (isWork[j]) workCount++;
        if (workCount > budgetForThis) break;
        if (workCount === budgetForThis) {
          const total = j - i + 1;
          if (total > bestTotal) {
            bestTotal = total;
            bestLeft = i;
            bestRight = j;
          }
        }
      }
    }

    if (bestLeft === -1) break;

    let used = 0;
    for (let i = bestLeft; i <= bestRight; i++) {
      blocked[i] = true;
      if (isWork[i]) used++;
    }
    remaining -= used;
    results.push(buildLeaveBlock(allDays, isWork, holidays, bestLeft, bestRight));
  }

  results.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
  return results;
}

function buildLeaveBlock(
  allDays: Date[],
  isWork: boolean[],
  holidays: PublicHoliday[],
  left: number,
  right: number
): LeaveBlock {
  const blockStart = allDays[left]!;
  const blockEnd = allDays[right]!;

  const leaveDates: Date[] = [];
  for (let i = left; i <= right; i++) {
    if (isWork[i]) leaveDates.push(allDays[i]!);
  }

  const totalDaysOff = right - left + 1;
  const used = leaveDates.length;
  const efficiency = used > 0 ? totalDaysOff / used : 0;
  const includedHolidays = holidays.filter(
    (h) => h.date >= blockStart && h.date <= blockEnd
  );

  const dateRange = `${format(blockStart, "d MMM")} – ${format(blockEnd, "d MMM yyyy")}`;
  const names = includedHolidays.map((h) => h.localName).join(", ");
  const includesStr = names ? `. Includes: ${names}` : "";
  const description = `${dateRange}: Take ${used} day${used > 1 ? "s" : ""} off → ${totalDaysOff} days total (${efficiency.toFixed(1)}x)${includesStr}`;

  return {
    startDate: blockStart,
    endDate: blockEnd,
    leaveDaysUsed: used,
    totalDaysOff,
    efficiency,
    leaveDates,
    holidays: includedHolidays,
    description,
  };
}
