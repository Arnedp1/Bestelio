import { describe, expect, it } from "vitest";
import {
  canSelectModifierOption,
  effectiveMaxSelections,
  MULTIPLE_MODIFIER_MAX,
  normalizeModifierGroup,
  toggleModifierOption,
  validateModifierSelection,
} from "./selection";

const group = (max: number, required: boolean, optionIds: string[]) => ({
  id: "g1",
  name: "Sauzen",
  minSelections: required ? 1 : 0,
  maxSelections: max,
  isRequired: required,
  options: optionIds.map((id) => ({ id, name: id, priceCents: 0 })),
});

describe("effectiveMaxSelections", () => {
  it("keeps single-select at 1", () => {
    expect(effectiveMaxSelections(1, 5)).toBe(1);
  });

  it("maps legacy 2 to unlimited within option count", () => {
    expect(effectiveMaxSelections(2, 5)).toBe(5);
    expect(effectiveMaxSelections(2, 120)).toBe(MULTIPLE_MODIFIER_MAX);
  });

  it("maps admin multiple (99) to option count cap", () => {
    expect(effectiveMaxSelections(99, 4)).toBe(4);
  });
});

describe("normalizeModifierGroup", () => {
  it("upgrades legacy maxSelections 2 for five options", () => {
    const normalized = normalizeModifierGroup(group(2, false, ["a", "b", "c", "d", "e"]));
    expect(normalized.maxSelections).toBe(5);
  });
});

describe("toggleModifierOption", () => {
  it("allows more than two picks when group allows multiple", () => {
    const g = normalizeModifierGroup(group(2, false, ["a", "b", "c", "d"]));
    let selected: string[] = [];
    for (const id of ["a", "b", "c", "d"]) {
      selected = toggleModifierOption(selected, id, g);
    }
    expect(selected).toEqual(["a", "b", "c", "d"]);
  });

  it("replaces selection when single-select", () => {
    const g = normalizeModifierGroup(group(1, true, ["a", "b"]));
    let selected = toggleModifierOption([], "a", g);
    selected = toggleModifierOption(selected, "b", g);
    expect(selected).toEqual(["b"]);
  });
});

describe("canSelectModifierOption", () => {
  it("keeps alternative options clickable for single-select groups", () => {
    const g = normalizeModifierGroup(group(1, true, ["a", "b"]));
    expect(canSelectModifierOption(g, ["a"], "b")).toBe(true);
  });
});

describe("validateModifierSelection", () => {
  it("requires minimum when mandatory", () => {
    const g = normalizeModifierGroup(group(99, true, ["a", "b"]));
    expect(validateModifierSelection([g], [])).toMatch(/minstens/);
    expect(validateModifierSelection([g], ["a"])).toBeNull();
  });
});
