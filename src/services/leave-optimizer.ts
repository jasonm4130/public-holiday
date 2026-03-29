import { addDays, isWeekend, isSameDay, format, eachDayOfInterval } from "date-fns";
import type { PublicHoliday, LeaveBlock, LeaveOption } from "../types/holiday";

function isHoliday(date: Date, holidays: PublicHoliday[]): boolean {
  return holidays.some((h) => isSameDay(h.date, date));
}

function isNonWorkDay(date: Date, holidays: PublicHoliday[]): boolean {
  return isWeekend(date) || isHoliday(date, holidays);
}

/**
 * Generate multiple leave plan options using all available leave days.
 *
 * Returns up to `optionCount` non-overlapping alternative plans,
 * each using exactly `leaveDays` workdays.
 */
export function optimizeLeave(
  holidays: PublicHoliday[],
  leaveDays: number,
  fromDate?: Date,
  numberOfBlocks: number = 1,
  optionCount: number = 5,
): LeaveOption[] {
  const start = fromDate ?? new Date();
  const end = addDays(start, 365);
  const allDays = eachDayOfInterval({ start, end });
  const n = allDays.length;

  const isWork = allDays.map((d) => !isNonWorkDay(d, holidays));

  if (numberOfBlocks <= 1) {
    return findTopSingleBlockOptions(allDays, isWork, holidays, leaveDays, n, optionCount);
  }
  return findTopMultiBlockOptions(
    allDays,
    isWork,
    holidays,
    leaveDays,
    numberOfBlocks,
    n,
    optionCount,
  );
}

/** Find top N non-overlapping single-block options. */
function findTopSingleBlockOptions(
  allDays: Date[],
  isWork: boolean[],
  holidays: PublicHoliday[],
  budget: number,
  n: number,
  count: number,
): LeaveOption[] {
  // Collect all valid blocks using exactly `budget` leave days
  const candidates: Array<{ left: number; right: number; total: number }> = [];

  for (let i = 0; i < n; i++) {
    let workCount = 0;
    for (let j = i; j < n; j++) {
      if (isWork[j]) workCount++;
      if (workCount > budget) break;
      if (workCount === budget) {
        candidates.push({ left: i, right: j, total: j - i + 1 });
      }
    }
  }

  // Sort by total days off descending
  candidates.sort((a, b) => b.total - a.total);

  // Greedily pick non-overlapping results
  const picked: typeof candidates = [];
  for (const c of candidates) {
    if (picked.length >= count) break;
    const overlaps = picked.some((p) => c.left <= p.right && c.right >= p.left);
    if (!overlaps) picked.push(c);
  }

  // Sort picked by total descending
  picked.sort((a, b) => b.total - a.total);

  return picked.map((p) => {
    const block = buildLeaveBlock(allDays, isWork, holidays, p.left, p.right);
    return {
      blocks: [block],
      totalLeaveDaysUsed: block.leaveDaysUsed,
      totalDaysOff: block.totalDaysOff,
      overallEfficiency: block.efficiency,
    };
  });
}

/** Find top N multi-block options by running greedy, then excluding used days. */
function findTopMultiBlockOptions(
  allDays: Date[],
  isWork: boolean[],
  holidays: PublicHoliday[],
  budget: number,
  numBlocks: number,
  n: number,
  count: number,
): LeaveOption[] {
  const options: LeaveOption[] = [];
  const globalBlocked = new Array<boolean>(n).fill(false);

  for (let opt = 0; opt < count; opt++) {
    const blocks: LeaveBlock[] = [];
    const localBlocked = globalBlocked.slice();
    let remaining = budget;

    for (let b = 0; b < numBlocks && remaining > 0; b++) {
      const blocksLeft = numBlocks - b;
      const budgetForThis = Math.ceil(remaining / blocksLeft);

      let bestLeft = -1;
      let bestRight = -1;
      let bestTotal = 0;

      for (let i = 0; i < n; i++) {
        if (localBlocked[i]) continue;
        let workCount = 0;
        for (let j = i; j < n; j++) {
          if (localBlocked[j]) break;
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
        localBlocked[i] = true;
        if (isWork[i]) used++;
      }
      remaining -= used;
      blocks.push(buildLeaveBlock(allDays, isWork, holidays, bestLeft, bestRight));
    }

    if (blocks.length === 0) break;

    // Block out this option's days for future iterations
    for (const block of blocks) {
      const startIdx = allDays.findIndex((d) => d.getTime() === block.startDate.getTime());
      const endIdx = allDays.findIndex((d) => d.getTime() === block.endDate.getTime());
      if (startIdx >= 0 && endIdx >= 0) {
        for (let i = startIdx; i <= endIdx; i++) {
          globalBlocked[i] = true;
        }
      }
    }

    blocks.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

    const totalUsed = blocks.reduce((s, b) => s + b.leaveDaysUsed, 0);
    const totalOff = blocks.reduce((s, b) => s + b.totalDaysOff, 0);

    options.push({
      blocks,
      totalLeaveDaysUsed: totalUsed,
      totalDaysOff: totalOff,
      overallEfficiency: totalUsed > 0 ? totalOff / totalUsed : 0,
    });
  }

  // Sort by total days off descending
  options.sort((a, b) => b.totalDaysOff - a.totalDaysOff);

  return options;
}

function buildLeaveBlock(
  allDays: Date[],
  isWork: boolean[],
  holidays: PublicHoliday[],
  left: number,
  right: number,
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
  const includedHolidays = holidays.filter((h) => h.date >= blockStart && h.date <= blockEnd);

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
