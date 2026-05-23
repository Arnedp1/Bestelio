import { describe, expect, it } from "vitest";
import { formatOpenStatusMessage, getOpenStatus, isOpenOnDate } from "./is-open";

describe("isOpenOnDate", () => {
  const hours = [
    { dayOfWeek: 1, openTime: "11:00", closeTime: "22:00", isClosed: false },
  ] as Parameters<typeof isOpenOnDate>[1];

  it("returns true on open weekday", () => {
    const monday = new Date("2026-05-18T12:00:00");
    expect(isOpenOnDate(monday, hours, [])).toBe(true);
  });

  it("respects closing exception", () => {
    const monday = new Date("2026-05-18T12:00:00");
    const exceptions = [
      { date: new Date("2026-05-18"), isClosed: true, reason: "Feestdag" },
    ] as Parameters<typeof isOpenOnDate>[2];
    expect(isOpenOnDate(monday, hours, exceptions)).toBe(false);
  });
});

describe("getOpenStatus", () => {
  const hours = [
    { dayOfWeek: 1, openTime: "11:00", closeTime: "22:00", isClosed: false },
  ] as Parameters<typeof getOpenStatus>[1];

  it("returns open during service hours", () => {
    const status = getOpenStatus(new Date("2026-05-18T14:00:00"), hours, []);
    expect(status.state).toBe("open");
    expect(formatOpenStatusMessage(status)).toBe("Nu open · tot 22:00");
  });

  it("returns closed before opening", () => {
    const status = getOpenStatus(new Date("2026-05-18T09:00:00"), hours, []);
    expect(status.state).toBe("closed_before");
    expect(formatOpenStatusMessage(status)).toBe("Nu gesloten · opent om 11:00");
  });

  it("returns closed after closing", () => {
    const status = getOpenStatus(new Date("2026-05-18T23:00:00"), hours, []);
    expect(status.state).toBe("closed_after");
    expect(formatOpenStatusMessage(status)).toContain("Nu gesloten");
  });
});
