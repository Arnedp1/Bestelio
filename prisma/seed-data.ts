import { loadMenuFromCsv } from "./load-menu-csv";

export type SeedProduct = {
  name: string;
  slug: string;
  description: string;
  priceCents: number;
  sortOrder: number;
  emoji: string;
};

export type SeedCategory = {
  name: string;
  slug: string;
  description: string;
  sortOrder: number;
  emoji: string;
  products: SeedProduct[];
};

export const SEED_BRAND = {
  displayName: "The Food Stop",
  primaryColor: "#EA580C",
  tagline: "Frieten, snacks & broodjes · Afhalen of leveren",
};

/** Menu uit prisma/data/thefoodstop_menu.csv (The Food Stop). */
export const SEED_CATEGORIES: SeedCategory[] = loadMenuFromCsv();
