"use client";

import type { StorefrontModifierGroup } from "@/lib/storefront/modifiers";
import {
  canSelectModifierOption,
  isMultipleModifierGroup,
  modifierSelectionHint,
  toggleModifierOption,
} from "@/lib/storefront/modifiers";

export function ModifierPicker({
  groups,
  selected,
  onChange,
  compact = false,
  touchFriendly = false,
}: {
  groups: StorefrontModifierGroup[];
  selected: string[];
  onChange: (next: string[]) => void;
  compact?: boolean;
  touchFriendly?: boolean;
}) {
  if (groups.length === 0) return null;

  return (
    <div className={compact ? "space-y-3" : "space-y-5"}>
      {groups.map((group) => {
        const hint = modifierSelectionHint(group);
        const multi = isMultipleModifierGroup(group.maxSelections);

        return (
          <fieldset
            key={group.id}
            className={`rounded-xl border border-stone-200 bg-stone-50/80 ${compact ? "p-3" : "p-4"}`}
          >
            <legend className={`font-semibold text-stone-800 ${compact ? "text-xs" : "text-sm"}`}>
              {group.name}
              {group.isRequired && <span className="text-[var(--brand)]"> *</span>}
              {hint && <span className="font-normal text-stone-500"> · {hint}</span>}
            </legend>
            <div
              className={
                compact
                  ? touchFriendly
                    ? "mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2"
                    : "mt-2 flex flex-col gap-1.5"
                  : "mt-3 flex flex-wrap gap-2"
              }
            >
              {group.options.map((opt) => {
                const active = selected.includes(opt.id);
                const disabled = !canSelectModifierOption(group, selected, opt.id);

                if (compact) {
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      disabled={disabled}
                      onClick={() => onChange(toggleModifierOption(selected, opt.id, group))}
                      className={`flex w-full items-center gap-3 rounded-lg border text-left font-medium transition ${
                        touchFriendly ? "min-h-[3.25rem] px-3.5 py-3 text-[0.95rem]" : "px-3 py-2.5 text-sm"
                      } ${
                        active
                          ? "border-[var(--brand)] bg-[var(--brand-light)] text-stone-900 shadow-sm"
                          : disabled
                            ? "cursor-not-allowed border-stone-200 bg-stone-100 text-stone-400"
                            : "border-stone-200 bg-white text-stone-800 hover:border-stone-300"
                      }`}
                    >
                      <span
                        className={`flex shrink-0 items-center justify-center border-2 ${
                          touchFriendly ? "h-6 w-6" : "h-5 w-5"
                        } ${
                          multi ? "rounded" : "rounded-full"
                        } ${
                          active
                            ? "border-[var(--brand)] bg-[var(--brand)] text-white"
                            : "border-stone-300 bg-white"
                        }`}
                        aria-hidden
                      >
                        {active && (
                          <svg
                            viewBox="0 0 12 12"
                            className={touchFriendly ? "h-3.5 w-3.5" : "h-3 w-3"}
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path
                              d="M2 6l3 3 5-5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                      </span>
                      <span className="min-w-0 flex-1 leading-snug">{opt.name}</span>
                      {opt.priceCents !== 0 && (
                        <span
                          className={`shrink-0 tabular-nums ${
                            touchFriendly ? "text-sm" : "text-xs"
                          } ${
                            active ? "text-[var(--brand)]" : "text-stone-500"
                          }`}
                        >
                          {opt.priceCents > 0 ? "+" : ""}€{" "}
                          {(opt.priceCents / 100).toFixed(2)}
                        </span>
                      )}
                    </button>
                  );
                }

                return (
                  <button
                    key={opt.id}
                    type="button"
                    disabled={disabled}
                    onClick={() => onChange(toggleModifierOption(selected, opt.id, group))}
                    className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                      active
                        ? "bg-[var(--brand)] text-white shadow-sm"
                        : disabled
                          ? "cursor-not-allowed bg-stone-100 text-stone-400 ring-1 ring-stone-200"
                          : "bg-white text-stone-700 ring-1 ring-stone-200 hover:ring-[var(--brand)]"
                    }`}
                  >
                    {opt.name}
                    {opt.priceCents > 0 && (
                      <span className={active ? "text-orange-100" : "text-stone-400"}>
                        {" "}
                        +€ {(opt.priceCents / 100).toFixed(2)}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </fieldset>
        );
      })}
    </div>
  );
}
