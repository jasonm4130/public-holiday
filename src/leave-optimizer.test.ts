import { describe, it, expect } from "vitest";
import { addDays, nextMonday, nextFriday, startOfDay } from "date-fns";
import { optimizeLeave } from "./services/leave-optimizer";
import type { PublicHoliday } from "./types/holiday";

function makeHoliday(date: Date, name: string): PublicHoliday {
  return {
    date: startOfDay(date),
    name,
    localName: name,
    global: true,
    counties: [],
  };
}

describe("leave-optimizer", () => {
  it("returns options using all leave days even without holidays", () => {
    const result = optimizeLeave([], 3);
    expect(result.length).toBeGreaterThanOrEqual(1);
    const best = result[0]!;
    expect(best.blocks.length).toBe(1);
    expect(best.totalLeaveDaysUsed).toBe(3);
    expect(best.totalDaysOff).toBeGreaterThanOrEqual(3);
  });

  it("uses all leave days in a single block around a Monday holiday", () => {
    const monday = nextMonday(new Date());
    const holidays = [makeHoliday(monday, "Test Holiday")];

    const result = optimizeLeave(holidays, 4, addDays(monday, -14));

    expect(result.length).toBeGreaterThanOrEqual(1);
    const best = result[0]!;
    expect(best.blocks.length).toBe(1);
    expect(best.totalLeaveDaysUsed).toBe(4);
    expect(best.totalDaysOff).toBeGreaterThanOrEqual(6);
  });

  it("maximises block length around Easter-like pattern", () => {
    const friday = nextFriday(addDays(new Date(), 30));
    const monday = addDays(friday, 3);
    const holidays = [makeHoliday(friday, "Good Friday"), makeHoliday(monday, "Easter Monday")];

    const result = optimizeLeave(holidays, 5, addDays(friday, -14));

    expect(result.length).toBeGreaterThanOrEqual(1);
    const best = result[0]!;
    expect(best.blocks.length).toBe(1);
    expect(best.totalLeaveDaysUsed).toBe(5);
    expect(best.totalDaysOff).toBeGreaterThanOrEqual(9);
  });

  it("distributes leave across multiple blocks", () => {
    const monday = nextMonday(addDays(new Date(), 14));
    const holidays = [
      makeHoliday(monday, "Holiday 1"),
      makeHoliday(addDays(monday, 56), "Holiday 2"),
    ];

    const result = optimizeLeave(holidays, 6, addDays(monday, -7), 2);

    expect(result.length).toBeGreaterThanOrEqual(1);
    const best = result[0]!;
    expect(best.blocks.length).toBe(2);
    expect(best.totalLeaveDaysUsed).toBe(6);
    // Blocks should not overlap (sorted by date)
    expect(best.blocks[0]!.endDate < best.blocks[1]!.startDate).toBe(true);
  });

  it("single block uses exact leave budget", () => {
    const monday = nextMonday(addDays(new Date(), 14));
    const holidays = [makeHoliday(monday, "Holiday")];

    const result = optimizeLeave(holidays, 10, addDays(monday, -14));

    expect(result.length).toBeGreaterThanOrEqual(1);
    const best = result[0]!;
    expect(best.blocks.length).toBe(1);
    expect(best.totalLeaveDaysUsed).toBe(10);
    expect(best.totalDaysOff).toBeGreaterThanOrEqual(14);
  });

  it("returns multiple alternative options for single block", () => {
    const monday = nextMonday(addDays(new Date(), 14));
    const holidays = [
      makeHoliday(monday, "Holiday 1"),
      makeHoliday(addDays(monday, 56), "Holiday 2"),
    ];

    const result = optimizeLeave(holidays, 5, addDays(monday, -7), 1, 5);

    // Should return more than one option when enough space exists
    expect(result.length).toBeGreaterThan(1);
    // All options should use exactly 5 leave days
    for (const opt of result) {
      expect(opt.totalLeaveDaysUsed).toBe(5);
    }
    // Options should be sorted by total days off descending
    for (let i = 1; i < result.length; i++) {
      expect(result[i - 1]!.totalDaysOff).toBeGreaterThanOrEqual(result[i]!.totalDaysOff);
    }
  });
});
