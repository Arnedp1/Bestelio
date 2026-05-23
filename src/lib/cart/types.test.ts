import { describe, expect, it } from "vitest";
import { cartLineKey, cartSubtotalCents } from "./types";

describe("cart", () => {
  it("sums line totals with modifiers", () => {
    const total = cartSubtotalCents({
      lines: [
        {
          productId: "p1",
          slug: "x",
          name: "Frieten",
          unitPriceCents: 350,
          quantity: 2,
          modifiers: [{ optionId: "m1", name: "Mayo", priceCents: 50 }],
        },
      ],
    });
    expect(total).toBe(800);
  });

  it("keys lines by product and modifiers", () => {
    const line = {
      productId: "p1",
      slug: "x",
      name: "A",
      unitPriceCents: 100,
      quantity: 1,
      modifiers: [{ optionId: "b", name: "B", priceCents: 0 }],
    };
    expect(cartLineKey(line)).toBe("p1:b");
  });
});
