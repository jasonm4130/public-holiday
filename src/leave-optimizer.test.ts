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
  it("returns a block using all leave days even without holidays", () => {
    const result = optimizeLeave([], 3);
    expect(result.length).toBe(1);
    expect(result[0]!.leaveDaysUsed).toBe(3);
    // 3 workdays should include surrounding weekend days
    expect(result[0]!.totalDaysOff).toBeGreaterThanOrEqual(3);
  });

  it("uses all leave days in a single block around a Monday holiday", () => {
    const monday = nextMonday(new Date());
    const holidays = [makeHoliday(monday, "Test Holiday")];

    const result = optimizeLeave(holidays, 4, addDays(monday, -14));

    expect(result.length).toBe(1);
    const best = result[0]!;
    // Should use exactly 4 leave days
    expect(best.leaveDaysUsed).toBe(4);
    // With a public holiday plus 4 leave days, should get a substantial block
    expect(best.totalDaysOff).toBeGreaterThanOrEqual(6);
  });

  it("maximises block length around Easter-like pattern", () => {
    const friday = nextFriday(addDays(new Date(), 30));
    const monday = addDays(friday, 3);
    const holidays = [
      makeHoliday(friday, "Good Friday"),
      makeHoliday(monday, "Easter Monday"),
    ];

    const result = optimizeLeave(holidays, 5, addDays(friday, -14));

    expect(result.length).toBe(1);
    // Should use all 5 leave days
    expect(result[0]!.leaveDaysUsed).toBe(5);
    // 5 leave days + 2 holidays + weekends should give a big block
    expect(result[0]!.totalDaysOff).toBeGreaterThanOrEqual(9);
  });

  it("distributes leave across multiple blocks", () => {
    const monday = nextMonday(addDays(new Date(), 14));
    const holidays = [
      makeHoliday(monday, "Holiday 1"),
      makeHoliday(addDays(monday, 56), "Holiday 2"),
    ];

    const result = optimizeLeave(holidays, 6, addDays(monday, -7), 2);

    expect(result.length).toBe(2);
    // Total leave used should equal budget
    const totalUsed = result.reduce((sum, b) => sum + b.leaveDaysUsed, 0);
    expect(totalUsed).toBe(6);
    // Blocks should not overlap (sorted by date)
    expect(result[0]!.endDate < result[1]!.startDate).toBe(true);
  });

  it("single block uses exact leave budget", () => {
    const monday = nextMonday(addDays(new Date(), 14));
    const holidays = [makeHoliday(monday, "Holiday")];

    const result = optimizeLeave(holidays, 10, addDays(monday, -14));

    expect(result.length).toBe(1);
    expect(result[0]!.leaveDaysUsed).toBe(10);
    // 10 leave days should span at least 2 weekends
    expect(result[0]!.totalDaysOff).toBeGreaterThanOrEqual(14);
  });
});
