import { describe, expect, it } from "vitest";
import { adminOrderBadgeKey, adminOrderStatusLabel } from "./order-display";

describe("adminOrderStatusLabel", () => {
  it("shows online betaald when payment is paid", () => {
    expect(
      adminOrderStatusLabel({ status: "CONFIRMED", paymentStatus: "PAID" })
    ).toBe("Online betaald");
  });

  it("shows afgerond when completed", () => {
    expect(
      adminOrderStatusLabel({ status: "COMPLETED", paymentStatus: "PAID" })
    ).toBe("Afgerond");
  });
});

describe("adminOrderBadgeKey", () => {
  it("uses PAID badge for paid open orders", () => {
    expect(adminOrderBadgeKey({ status: "PREPARING", paymentStatus: "PAID" })).toBe(
      "PAID"
    );
  });
});
