import type { ModifierGroup } from "@/lib/modifiers/selection";
import { normalizeModifierGroups } from "@/lib/modifiers/selection";
import type { StorefrontModifierGroup } from "./modifiers";

type PrismaModifierGroup = {
  id: string;
  name: string;
  minSelections: number;
  maxSelections: number;
  isRequired: boolean;
  options: { id: string; name: string; priceCents: number }[];
};

export function serializeModifierGroups(
  groups: PrismaModifierGroup[]
): StorefrontModifierGroup[] {
  const mapped: ModifierGroup[] = groups.map((g) => ({
    id: g.id,
    name: g.name,
    minSelections: g.minSelections,
    maxSelections: g.maxSelections,
    isRequired: g.isRequired,
    options: g.options.map((o) => ({
      id: o.id,
      name: o.name,
      priceCents: o.priceCents,
    })),
  }));

  return normalizeModifierGroups(mapped);
}
