import { describe, expect, it } from "vitest";
import { hhMmSchema, normalizeHhMm } from "./time";

describe("normalizeHhMm", () => {
  it("pads single-digit hours", () => {
    expect(normalizeHhMm("9:00")).toBe("09:00");
  });

  it("strips seconds", () => {
    expect(normalizeHhMm("22:00:00")).toBe("22:00");
  });

  it("trims whitespace", () => {
    expect(normalizeHhMm(" 11:30 ")).toBe("11:30");
  });

  it("expands hour-only input", () => {
    expect(normalizeHhMm("23")).toBe("23:00");
    expect(normalizeHhMm("9")).toBe("09:00");
  });

  it("rejects invalid hour-only input", () => {
    expect(normalizeHhMm("24")).toBeUndefined();
  });
});

describe("hhMmSchema", () => {
  it("accepts normalized values", () => {
    expect(hhMmSchema.parse("9:00")).toBe("09:00");
    expect(hhMmSchema.parse("23")).toBe("23:00");
  });

  it("rejects invalid input", () => {
    expect(() => hhMmSchema.parse("half tien")).toThrow();
  });
});
