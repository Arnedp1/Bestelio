/** Zelfde waarde als admin «Meerdere opties tegelijk» (CategoryModifierGroupFields). */
export const MULTIPLE_MODIFIER_MAX = 99;

export type ModifierOption = { id: string; name: string; priceCents: number };

export type ModifierGroup = {
  id: string;
  name: string;
  minSelections: number;
  maxSelections: number;
  isRequired: boolean;
  options: ModifierOption[];
};

/** Admin slaat 99 op voor «meerdere»; oudere rijen kunnen nog 2–98 hebben met dezelfde bedoeling. */
export function effectiveMaxSelections(stored: number, optionCount: number): number {
  if (stored <= 1) return 1;
  return Math.min(MULTIPLE_MODIFIER_MAX, Math.max(optionCount, 1));
}

export function effectiveMinSelections(stored: number, isRequired: boolean): number {
  if (!isRequired) return Math.max(0, stored);
  return Math.max(stored, 1);
}

export function normalizeModifierGroup<G extends ModifierGroup>(group: G): G {
  const optionCount = group.options.length;
  return {
    ...group,
    minSelections: effectiveMinSelections(group.minSelections, group.isRequired),
    maxSelections: effectiveMaxSelections(group.maxSelections, optionCount),
  };
}

export function normalizeModifierGroups<G extends ModifierGroup>(groups: G[]): G[] {
  return groups
    .filter((g) => g.options.length > 0)
    .map((g) => normalizeModifierGroup(g));
}

export function isMultipleModifierGroup(maxSelections: number): boolean {
  return maxSelections > 1;
}

export function selectionCountInGroup(group: ModifierGroup, selected: string[]): number {
  return selected.filter((id) => group.options.some((o) => o.id === id)).length;
}

export function modifierSelectionHint(group: ModifierGroup): string | null {
  if (group.maxSelections <= 1) {
    return group.isRequired ? "Kies er één" : "Optioneel · max. 1";
  }
  return group.isRequired ? "Verplicht · meerdere mogelijk" : "Meerdere mogelijk";
}

export function canSelectModifierOption(
  group: ModifierGroup,
  selected: string[],
  optionId: string
): boolean {
  if (selected.includes(optionId)) return true;
  // Single-select behaves like radio buttons: another click replaces current choice.
  if (group.maxSelections <= 1) return true;
  return selectionCountInGroup(group, selected) < group.maxSelections;
}

/** Popup only when the customer can (or must) choose between options. */
export function hasSelectableOptions(groups: ModifierGroup[]): boolean {
  return groups.some((group) => {
    const count = group.options.length;
    if (count === 0) return false;
    if (count > 1) return true;
    return !group.isRequired;
  });
}

/** Auto-apply when there is only one required option in a group (no real choice). */
export function defaultModifierSelection(groups: ModifierGroup[]): string[] {
  return groups
    .filter((g) => g.options.length === 1 && g.isRequired)
    .map((g) => g.options[0].id);
}

/** Groups shown in the extras popup (multiple options or optional single). */
export function groupsRequiringChoice(groups: ModifierGroup[]): ModifierGroup[] {
  return groups.filter((g) => {
    if (g.options.length > 1) return true;
    return g.options.length === 1 && !g.isRequired;
  });
}

export function toggleModifierOption(
  selected: string[],
  optionId: string,
  group: ModifierGroup
): string[] {
  if (selected.includes(optionId)) {
    return selected.filter((x) => x !== optionId);
  }
  if (group.maxSelections <= 1) {
    const without = selected.filter((oid) => !group.options.some((o) => o.id === oid));
    return [...without, optionId];
  }
  if (!canSelectModifierOption(group, selected, optionId)) {
    return selected;
  }
  return [...selected, optionId];
}

export function validateModifierSelection(
  groups: ModifierGroup[],
  selected: string[]
): string | null {
  for (const group of groups) {
    const count = selectionCountInGroup(group, selected);
    if (group.isRequired && count < group.minSelections) {
      return `Kies minstens ${group.minSelections} optie(s) voor ${group.name}`;
    }
    if (count > group.maxSelections) {
      return group.maxSelections === 1
        ? `Kies maximaal één optie voor ${group.name}`
        : `Kies maximaal ${group.maxSelections} optie(s) voor ${group.name}`;
    }
  }
  return null;
}

/** Valideer alle groepen van een categorie (inclusief auto-toegepaste opties). */
export function validateCategoryModifierSelection(
  allGroups: ModifierGroup[],
  selected: string[]
): string | null {
  const normalized = normalizeModifierGroups(allGroups);
  const choiceGroups = groupsRequiringChoice(normalized);
  return validateModifierSelection(choiceGroups, selected);
}
