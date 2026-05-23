import { describe, expect, it } from "vitest";
import { slotRemaining } from "./capacity";

describe("slotRemaining", () => {
  it("never returns negative remaining", () => {
    expect(slotRemaining(4, 4)).toBe(0);
    expect(slotRemaining(4, 3)).toBe(1);
    expect(slotRemaining(4, 10)).toBe(0);
  });
});
