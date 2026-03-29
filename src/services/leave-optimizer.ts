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

function formatBlockDescription(
  start: Date,
  end: Date,
  leaveDays: number,
  totalDays: number,
  holidays: PublicHoliday[]
): string {
  const dateRange = `${format(start, "d MMM")} – ${format(end, "d MMM yyyy")}`;
  const holidayNames = holidays.map((h) => h.localName).join(", ");
  const ratio = (totalDays / leaveDays).toFixed(1);
  const includesStr = holidayNames ? `. Includes: ${holidayNames}` : "";
  return `${dateRange}: Take ${leaveDays} day${leaveDays > 1 ? "s" : ""} off → ${totalDays} days total (${ratio}x)${includesStr}`;
}

function createCandidate(
  allDays: Date[],
  isWork: boolean[],
  left: number,
  right: number,
  holidays: PublicHoliday[]
): LeaveBlock {
  const blockStart = allDays[left]!;
  const blockEnd = allDays[right]!;

  const leaveDates: Date[] = [];
  for (let i = left; i <= right; i++) {
    if (isWork[i]) leaveDates.push(allDays[i]!);
  }

  const totalDaysOff = right - left + 1;
  const efficiency = totalDaysOff / leaveDates.length;

  const includedHolidays = holidays.filter(
    (h) => h.date >= blockStart && h.date <= blockEnd
  );

  return {
    startDate: blockStart,
    endDate: blockEnd,
    leaveDaysUsed: leaveDates.length,
    totalDaysOff,
    efficiency,
    leaveDates,
    holidays: includedHolidays,
    description: formatBlockDescription(
      blockStart,
      blockEnd,
      leaveDates.length,
      totalDaysOff,
      includedHolidays
    ),
  };
}

/**
 * Find the best continuous blocks of days off for a given leave budget.
 *
 * Every day within a returned block is guaranteed to be either a weekend,
 * a public holiday, or a leave day — no uncovered work-day gaps.
 *
 * Three strategies are used to find candidates:
 * 1. Sliding window: finds the largest continuous block at each boundary
 * 2. Partial segments: takes K days from the start/end of a work segment
 *    to create smaller high-efficiency blocks (e.g. "take Friday off → 3-day weekend")
 * 3. Segment bridging: fills entire work segments between free periods
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

  // Classify each day as work or free
  const isWork = allDays.map((d) => !isNonWorkDay(d, holidays));

  // Prefix sum for O(1) work-day range queries
  const prefix = new Array(n + 1).fill(0) as number[];
  for (let i = 0; i < n; i++) {
    prefix[i + 1] = prefix[i]! + (isWork[i] ? 1 : 0);
  }
  const workInRange = (l: number, r: number) => prefix[r + 1]! - prefix[l]!;

  const candidates: LeaveBlock[] = [];
  const seen = new Set<string>();

  function addCandidate(l: number, r: number) {
    if (l < 0 || r >= n || l > r) return;
    const work = workInRange(l, r);
    if (work === 0 || work > leaveDays) return;

    const key = `${format(allDays[l]!, "yyyy-MM-dd")}_${format(allDays[r]!, "yyyy-MM-dd")}`;
    if (seen.has(key)) return;
    seen.add(key);

    candidates.push(createCandidate(allDays, isWork, l, r, holidays));
  }

  // --- Strategy 1: Sliding window for maximal continuous blocks ---
  // For each right endpoint at a natural boundary (next day is a workday
  // or end of range), the window [left..right] is the largest contiguous
  // block using at most `leaveDays` work days.
  let left = 0;
  for (let right = 0; right < n; right++) {
    while (left <= right && workInRange(left, right) > leaveDays) {
      left++;
    }
    const work = workInRange(left, right);
    if (work === 0) continue;
    // Only record at natural end boundaries
    if (right < n - 1 && !isWork[right + 1]) continue;
    addCandidate(left, right);
  }

  // --- Build work-segment index ---
  const workSegs: [number, number][] = [];
  let segStart = -1;
  for (let i = 0; i < n; i++) {
    if (isWork[i] && segStart === -1) segStart = i;
    if ((!isWork[i] || i === n - 1) && segStart !== -1) {
      const segEnd = isWork[i] ? i : i - 1;
      if (segEnd >= segStart) workSegs.push([segStart, segEnd]);
      segStart = -1;
    }
  }

  // --- Strategy 2: Partial work segments ---
  // Taking K days from the start or end of a single work segment creates
  // a continuous block connecting to adjacent weekends/holidays.
  for (const [segL, segR] of workSegs) {
    const segLen = segR - segL + 1;
    for (let k = 1; k <= Math.min(segLen, leaveDays); k++) {
      // Last k days of segment → connects to free period after
      {
        let bL = segR - k + 1;
        let bR = segR;
        while (bL > 0 && !isWork[bL - 1]) bL--;
        while (bR < n - 1 && !isWork[bR + 1]) bR++;
        addCandidate(bL, bR);
      }
      // First k days of segment → connects to free period before
      {
        let bL = segL;
        let bR = segL + k - 1;
        while (bL > 0 && !isWork[bL - 1]) bL--;
        while (bR < n - 1 && !isWork[bR + 1]) bR++;
        addCandidate(bL, bR);
      }
    }
  }

  // --- Strategy 3: Bridge consecutive work segments ---
  // Fill entire work segments between free periods to create large blocks.
  for (let i = 0; i < workSegs.length; i++) {
    let totalWork = 0;
    for (let j = i; j < workSegs.length; j++) {
      totalWork += workSegs[j]![1] - workSegs[j]![0] + 1;
      if (totalWork > leaveDays) break;

      let bL = workSegs[i]![0];
      let bR = workSegs[j]![1];
      while (bL > 0 && !isWork[bL - 1]) bL--;
      while (bR < n - 1 && !isWork[bR + 1]) bR++;
      addCandidate(bL, bR);
    }
  }

  // Pick the best block for each leave-day count (1..leaveDays),
  // giving the user one option per "budget level" to compare.
  const bestByCount = new Map<number, LeaveBlock>();
  for (const c of candidates) {
    const existing = bestByCount.get(c.leaveDaysUsed);
    if (
      !existing ||
      c.totalDaysOff > existing.totalDaysOff ||
      (c.totalDaysOff === existing.totalDaysOff &&
        c.efficiency > existing.efficiency)
    ) {
      bestByCount.set(c.leaveDaysUsed, c);
    }
  }

  // Sort by efficiency (highest first)
  const results = [...bestByCount.values()].sort((a, b) => {
    if (b.efficiency !== a.efficiency) return b.efficiency - a.efficiency;
    return b.totalDaysOff - a.totalDaysOff;
  });

  return results.slice(0, 5);
}
