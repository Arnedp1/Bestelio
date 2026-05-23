import { describe, expect, it } from "vitest";
import {
  categoryModifierTemplatesFromRows,
  parseModifierColumn,
  parseOptionToken,
} from "../../../prisma/parse-category-modifiers";

describe("parseOptionToken", () => {
  it("parses priced and free options", () => {
    expect(parseOptionToken("Américain +€1.10")).toEqual({
      name: "Américain",
      priceCents: 110,
      isDefault: false,
    });
    expect(parseOptionToken("Pistolet (gratis)")).toEqual({
      name: "Pistolet",
      priceCents: 0,
      isDefault: true,
    });
    expect(parseOptionToken("Geen saus")).toEqual({
      name: "Geen saus",
      priceCents: 0,
      isDefault: true,
    });
  });
});

describe("parseModifierColumn", () => {
  it("splits friet saus into cold and warm groups", () => {
    const sample =
      "Geen saus / Mayo +€1.10 | Warme saus: Stoofvlees +€5.00 / Stoofvleessaus +€3.00";
    const groups = parseModifierColumn(sample, "opties_saus");
    expect(groups).toHaveLength(2);
    expect(groups[0].name).toBe("Saus");
    expect(groups[1].name).toBe("Warme saus");
  });
});

describe("categoryModifierTemplatesFromRows", () => {
  it("picks richest modifier row per category", () => {
    const templates = categoryModifierTemplatesFromRows([
      {
        category: "Snack",
        name: "Bami",
        optiesKeuze: "",
        optiesSaus: "",
        supplementenExtra: "",
      },
      {
        category: "Snack",
        name: "Boulet speciaal",
        optiesKeuze: "Tomaten Ketchup / Curry Ketchup",
        optiesSaus: "",
        supplementenExtra: "",
      },
    ]);
    expect(templates).toHaveLength(1);
    expect(templates[0].groups[0].options).toHaveLength(2);
  });
});
