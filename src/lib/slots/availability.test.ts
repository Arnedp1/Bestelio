import { describe, expect, it } from "vitest";
import { filterSlotsByLeadTime, type AvailableSlot } from "./availability";

function slot(startsAt: Date): AvailableSlot {
  return {
    id: "1",
    startsAt,
    endsAt: new Date(startsAt.getTime() + 15 * 60_000),
    fulfillment: "PICKUP",
    maxOrders: 8,
    bookedCount: 0,
    remaining: 8,
  };
}

describe("filterSlotsByLeadTime", () => {
  it("filters same-day slots before lead cutoff", () => {
    const today = new Date();
    const soon = new Date(Date.now() + 5 * 60_000);
    const later = new Date(Date.now() + 45 * 60_000);
    const result = filterSlotsByLeadTime(
      [slot(soon), slot(later)],
      today,
      30
    );
    expect(result).toHaveLength(1);
    expect(result[0].startsAt).toEqual(later);
  });

  it("keeps all slots on a future date", () => {
    const future = new Date();
    future.setDate(future.getDate() + 3);
    const result = filterSlotsByLeadTime([slot(future), slot(future)], future, 30);
    expect(result).toHaveLength(2);
  });
});
