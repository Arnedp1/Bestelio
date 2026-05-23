import { readFileSync } from "fs";
import { join } from "path";
import { MULTIPLE_MODIFIER_MAX } from "../src/lib/modifiers/selection";
import { parseCsvLine, slugify } from "./load-menu-csv";

export type ParsedModifierOption = {
  name: string;
  priceCents: number;
  isDefault: boolean;
};

export type ParsedModifierGroup = {
  name: string;
  maxSelections: number;
  isRequired: boolean;
  options: ParsedModifierOption[];
};

export type CsvMenuRowWithModifiers = {
  category: string;
  name: string;
  optiesKeuze: string;
  optiesSaus: string;
  supplementenExtra: string;
};

export type CategoryModifierTemplate = {
  categoryName: string;
  categorySlug: string;
  groups: ParsedModifierGroup[];
};

type ModifierColumn = "opties_keuze" | "opties_saus" | "supplementen_extra";

const KEUZE_GROUP_NAMES = ["Keuze", "Brood", "Formaat"] as const;

export function parseOptionToken(raw: string): ParsedModifierOption | null {
  const original = raw.trim();
  if (!original) return null;

  let name = original;
  let priceCents = 0;

  if (/\(gratis\)/i.test(original)) {
    name = name.replace(/\s*\(gratis\)/gi, "").trim();
  }

  const parenMinus = /\s*\(-€\s*([\d.,]+)\)\s*$/i;
  const parenPlus = /\s*\(\+€\s*([\d.,]+)\)\s*$/i;
  const plusSuffix = /\s*\+€\s*([\d.,]+)\s*$/i;
  const parenEuroPlus = /\s*\(€\s*([\d.,]+)\)\s*$/i;

  const minusMatch = name.match(parenMinus);
  if (minusMatch) {
    priceCents = -Math.round(Number.parseFloat(minusMatch[1].replace(",", ".")) * 100);
    name = name.replace(parenMinus, "").trim();
  } else {
    const plusMatch =
      name.match(parenPlus) ??
      name.match(plusSuffix) ??
      name.match(parenEuroPlus) ??
      name.match(/\s*\(\+([\d.,]+)\)\s*$/);
    if (plusMatch) {
      priceCents = Math.round(Number.parseFloat(plusMatch[1].replace(",", ".")) * 100);
      name = name
        .replace(parenPlus, "")
        .replace(plusSuffix, "")
        .replace(parenEuroPlus, "")
        .replace(/\s*\(\+[\d.,]+\)\s*$/, "")
        .trim();
    }
  }

  if (!name) return null;

  const isDefault =
    /\(gratis\)/i.test(original) ||
    /^geen\s/i.test(name) ||
    /^zonder\s/i.test(name);

  return { name, priceCents, isDefault };
}

function inferGroupName(
  segment: string,
  column: ModifierColumn,
  segmentIndex: number
): { groupName: string; optionsPart: string } {
  const colonIdx = segment.indexOf(":");
  if (colonIdx > 0 && colonIdx < 60) {
    return {
      groupName: segment.slice(0, colonIdx).trim(),
      optionsPart: segment.slice(colonIdx + 1).trim(),
    };
  }

  if (column === "supplementen_extra") {
    return { groupName: "Extra's", optionsPart: segment };
  }

  if (column === "opties_saus") {
    return {
      groupName: segmentIndex === 0 ? "Saus" : "Warme saus",
      optionsPart: segment,
    };
  }

  const lower = segment.toLowerCase();
  if (/ketchup|curry/.test(lower) && !/saus/.test(lower)) {
    return { groupName: "Saus", optionsPart: segment };
  }
  if (/wit|bruin/.test(lower) && !/smos|baguette|klein/.test(lower)) {
    return { groupName: "Brood", optionsPart: segment };
  }
  if (/smos/.test(lower)) {
    return { groupName: "Smos", optionsPart: segment };
  }
  if (/klein|baguette/.test(lower)) {
    return { groupName: "Formaat", optionsPart: segment };
  }
  if (/pistolet|baguette/.test(lower) && segmentIndex > 0) {
    return { groupName: "Brood", optionsPart: segment };
  }
  if (/gebakken ajuin|zonder gebakken/.test(lower)) {
    return { groupName: "Keuze", optionsPart: segment };
  }
  if (/zout|saté|saté/.test(lower)) {
    return { groupName: "Keuze", optionsPart: segment };
  }

  return {
    groupName: KEUZE_GROUP_NAMES[segmentIndex] ?? `Keuze ${segmentIndex + 1}`,
    optionsPart: segment,
  };
}

function maxSelectionsForGroup(column: ModifierColumn): number {
  return column === "supplementen_extra" ? MULTIPLE_MODIFIER_MAX : 1;
}

export function parseModifierColumn(
  value: string,
  column: ModifierColumn
): ParsedModifierGroup[] {
  const trimmed = value.trim();
  if (!trimmed) return [];

  const segments = trimmed.split("|").map((s) => s.trim()).filter(Boolean);
  const groups: ParsedModifierGroup[] = [];

  for (let i = 0; i < segments.length; i++) {
    const { groupName, optionsPart } = inferGroupName(segments[i], column, i);
    const options = optionsPart
      .split("/")
      .map((part) => parseOptionToken(part))
      .filter((o): o is ParsedModifierOption => o !== null);

    if (options.length === 0) continue;

    groups.push({
      name: groupName,
      maxSelections: maxSelectionsForGroup(column),
      isRequired: false,
      options,
    });
  }

  return groups;
}

export function parseMenuCsvWithModifiers(content: string): CsvMenuRowWithModifiers[] {
  const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const rows: CsvMenuRowWithModifiers[] = [];

  for (let i = 1; i < lines.length; i++) {
    const fields = parseCsvLine(lines[i]);
    const [category, name, , , optiesKeuze, optiesSaus, supplementenExtra] = fields;
    if (!category?.trim() || !name?.trim()) continue;

    rows.push({
      category: category.trim(),
      name: name.trim(),
      optiesKeuze: (optiesKeuze ?? "").trim(),
      optiesSaus: (optiesSaus ?? "").trim(),
      supplementenExtra: (supplementenExtra ?? "").trim(),
    });
  }

  return rows;
}

function modifierRichness(row: CsvMenuRowWithModifiers): number {
  return row.optiesKeuze.length + row.optiesSaus.length + row.supplementenExtra.length;
}

export function categoryModifierTemplatesFromRows(
  rows: CsvMenuRowWithModifiers[]
): CategoryModifierTemplate[] {
  const byCategory = new Map<string, CsvMenuRowWithModifiers[]>();

  for (const row of rows) {
    const list = byCategory.get(row.category) ?? [];
    list.push(row);
    byCategory.set(row.category, list);
  }

  const templates: CategoryModifierTemplate[] = [];

  for (const [categoryName, categoryRows] of byCategory) {
    const canonical = categoryRows.reduce((best, row) =>
      modifierRichness(row) > modifierRichness(best) ? row : best
    );

    const groups = [
      ...parseModifierColumn(canonical.optiesKeuze, "opties_keuze"),
      ...parseModifierColumn(canonical.optiesSaus, "opties_saus"),
      ...parseModifierColumn(canonical.supplementenExtra, "supplementen_extra"),
    ];

    if (groups.length === 0) continue;

    templates.push({
      categoryName,
      categorySlug: slugify(categoryName),
      groups,
    });
  }

  return templates;
}

export function loadCategoryModifierTemplates(
  filePath = join(__dirname, "data", "thefoodstop_menu_modifiers.csv")
): CategoryModifierTemplate[] {
  const content = readFileSync(filePath, "utf8");
  return categoryModifierTemplatesFromRows(parseMenuCsvWithModifiers(content));
}
