import { readFileSync } from "fs";
import { join } from "path";
import { categoryEmoji } from "../src/lib/storefront/category-emoji";
import type { SeedCategory, SeedProduct } from "./seed-data";

export type CsvMenuRow = {
  category: string;
  name: string;
  description: string;
  priceEur: number;
};

export function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (ch === "," && !inQuotes) {
      fields.push(current.trim());
      current = "";
      continue;
    }
    current += ch;
  }
  fields.push(current.trim());
  return fields;
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function uniqueSlug(base: string, used: Set<string>): string {
  let slug = base || "item";
  if (!used.has(slug)) {
    used.add(slug);
    return slug;
  }
  let n = 2;
  while (used.has(`${slug}-${n}`)) n++;
  slug = `${slug}-${n}`;
  used.add(slug);
  return slug;
}

export function parseMenuCsv(content: string): CsvMenuRow[] {
  const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const rows: CsvMenuRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const [category, name, description, priceRaw] = parseCsvLine(lines[i]);
    if (!category?.trim() || !name?.trim()) continue;

    const priceEur = Number.parseFloat(priceRaw?.replace(",", ".") ?? "");
    if (!Number.isFinite(priceEur) || priceEur < 0) continue;

    rows.push({
      category: category.trim(),
      name: name.trim(),
      description: (description ?? "").trim(),
      priceEur,
    });
  }

  return rows;
}

export function csvRowsToSeedCategories(rows: CsvMenuRow[]): SeedCategory[] {
  const categoryOrder: string[] = [];
  const byCategory = new Map<string, CsvMenuRow[]>();
  const tenantProductSlugs = new Set<string>();

  for (const row of rows) {
    if (!byCategory.has(row.category)) {
      categoryOrder.push(row.category);
      byCategory.set(row.category, []);
    }
    byCategory.get(row.category)!.push(row);
  }

  return categoryOrder.map((categoryName, catIndex) => {
    const catSlug = slugify(categoryName);
    const items = byCategory.get(categoryName) ?? [];

    const products: SeedProduct[] = items.map((row, productIndex) => {
      const baseSlug = slugify(`${catSlug}-${row.name}`);
      const slug = uniqueSlug(baseSlug, tenantProductSlugs);
      return {
        name: row.name,
        slug,
        description: row.description,
        priceCents: Math.round(row.priceEur * 100),
        sortOrder: productIndex + 1,
        emoji: categoryEmoji(catSlug),
      };
    });

    return {
      name: categoryName,
      slug: catSlug,
      description: "",
      sortOrder: catIndex + 1,
      emoji: categoryEmoji(catSlug),
      products,
    };
  });
}

export function loadMenuFromCsv(
  filePath = join(__dirname, "data", "thefoodstop_menu.csv")
): SeedCategory[] {
  const content = readFileSync(filePath, "utf8");
  return csvRowsToSeedCategories(parseMenuCsv(content));
}
