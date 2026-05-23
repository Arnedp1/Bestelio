import { describe, expect, it } from "vitest";
import {
  addDaysIso,
  buildCalendarMonth,
  compareIso,
  formatDateDisplay,
  isoDateFromDate,
  isIsoInRange,
  parseIsoDate,
} from "./calendar";

describe("calendar", () => {
  it("formats ISO dates for display", () => {
    expect(formatDateDisplay("2026-05-22")).toContain("2026");
  });

  it("adds days to ISO strings", () => {
    expect(addDaysIso("2026-05-22", 1)).toBe("2026-05-23");
  });

  it("checks range", () => {
    expect(isIsoInRange("2026-05-22", "2026-05-20", "2026-05-25")).toBe(true);
    expect(isIsoInRange("2026-05-19", "2026-05-20")).toBe(false);
  });

  it("builds 42 cells for a month", () => {
    expect(buildCalendarMonth(2026, 4)).toHaveLength(42);
  });

  it("round-trips parse and iso", () => {
    const d = new Date(2026, 4, 22);
    expect(isoDateFromDate(parseIsoDate(isoDateFromDate(d)))).toBe(isoDateFromDate(d));
  });

  it("compares ISO lexicographically", () => {
    expect(compareIso("2026-05-01", "2026-05-02")).toBe(-1);
  });
});
