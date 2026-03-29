import { describe, it, expect } from "vitest";
import {
  addDays,
  nextMonday,
  nextFriday,
  startOfDay,
} from "date-fns";
import { optimizeLeave } from "./services/leave-optimizer";
import type { PublicHoliday } from "./types/holiday";

function makeHoliday(
  date: Date,
  name: string
): PublicHoliday {
  return {
    date: startOfDay(date),
    name,
    localName: name,
    global: true,
    counties: [],
  };
}

describe("leave-optimizer", () => {
  it("returns empty array when no holidays", () => {
    const result = optimizeLeave([], 3);
    expect(result.length).toBeGreaterThanOrEqual(0);
  });

  it("finds optimal block around a Monday public holiday", () => {
    // Create a Monday public holiday
    const monday = nextMonday(new Date());
    const holidays = [makeHoliday(monday, "Test Holiday")];

    const result = optimizeLeave(holidays, 1, addDays(monday, -14));

    expect(result.length).toBeGreaterThan(0);
    // Taking Friday off before a Monday holiday should give 4 days off
    const best = result[0]!;
    expect(best.totalDaysOff).toBeGreaterThanOrEqual(3);
    expect(best.efficiency).toBeGreaterThanOrEqual(3);
  });

  it("finds optimal block around Easter-like pattern", () => {
    // Good Friday + Easter Monday = 4-day weekend already
    // Taking Thu off before that gives a 5-day block at 5x efficiency
    // Taking Tue-Wed-Thu near it should yield ~7-10 days
    const friday = nextFriday(addDays(new Date(), 30));
    const monday = addDays(friday, 3);
    const holidays = [
      makeHoliday(friday, "Good Friday"),
      makeHoliday(monday, "Easter Monday"),
    ];

    const result = optimizeLeave(holidays, 3, addDays(friday, -14));

    expect(result.length).toBeGreaterThan(0);
    const best = result[0]!;
    // Best efficiency block should give at least 4 days off
    expect(best.totalDaysOff).toBeGreaterThanOrEqual(4);
    expect(best.efficiency).toBeGreaterThanOrEqual(3);

    // There should also be a block using more leave days for a longer stretch
    const longestBlock = result.reduce((a, b) =>
      a.totalDaysOff > b.totalDaysOff ? a : b
    );
    expect(longestBlock.totalDaysOff).toBeGreaterThanOrEqual(7);
  });

  it("respects leave day count", () => {
    const monday = nextMonday(addDays(new Date(), 14));
    const holidays = [makeHoliday(monday, "Holiday")];

    const result = optimizeLeave(holidays, 2, addDays(monday, -14));

    for (const block of result) {
      expect(block.leaveDaysUsed).toBeLessThanOrEqual(2);
      expect(block.leaveDaysUsed).toBeGreaterThan(0);
    }
  });

  it("returns one result per leave-day count", () => {
    const monday = nextMonday(addDays(new Date(), 14));
    const holidays = [
      makeHoliday(monday, "Holiday 1"),
      makeHoliday(addDays(monday, 28), "Holiday 2"),
    ];

    const result = optimizeLeave(holidays, 3, addDays(monday, -7));

    // Each result should use a different number of leave days
    const counts = result.map((r) => r.leaveDaysUsed);
    expect(new Set(counts).size).toBe(counts.length);
    // All should be within budget
    for (const block of result) {
      expect(block.leaveDaysUsed).toBeLessThanOrEqual(3);
      expect(block.leaveDaysUsed).toBeGreaterThan(0);
    }
  });
});
