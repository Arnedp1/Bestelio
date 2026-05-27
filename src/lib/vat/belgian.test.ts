import { describe, expect, it } from "vitest";
import { BE_FOOD_VAT_RATE, splitInclusiveVatCents, sumVatBreakdown } from "./belgian";

describe("splitInclusiveVatCents", () => {
  it("splitst 6% BTW correct voor 10,60 EUR", () => {
    const { exclCents, vatCents } = splitInclusiveVatCents(1060, BE_FOOD_VAT_RATE);
    expect(exclCents + vatCents).toBe(1060);
    expect(vatCents).toBe(60);
    expect(exclCents).toBe(1000);
  });
});

describe("sumVatBreakdown", () => {
  it("telt regels op", () => {
    const total = sumVatBreakdown([
      { exclCents: 1000, vatCents: 60 },
      { exclCents: 500, vatCents: 30 },
    ]);
    expect(total.inclCents).toBe(1590);
    expect(total.vatCents).toBe(90);
  });
});
