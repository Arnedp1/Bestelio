"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ConfirmDeleteForm } from "@/components/admin/ConfirmDeleteForm";
import { SortableList } from "@/components/admin/SortableList";
import { SortableDragHandle } from "@/components/admin/sortable/SortableDragHandle";
import {
  btnDanger,
  btnPrimary,
  btnSecondary,
  CheckboxField,
  FormField,
  inputClass,
} from "@/components/admin/FormField";
import { deleteCategory, reorderCategories, upsertCategory } from "../actions";
import { CategoryModifiersOverlay } from "./CategoryModifiersOverlay";
import type { CategoryModifierGroupWithOptions } from "./CategoryModifiersPanel";

export type AdminCategory = {
  id: string;
  name: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
  productCount: number;
  modifierGroups: CategoryModifierGroupWithOptions[];
};

function syncCategoryUrl(
  router: ReturnType<typeof useRouter>,
  searchParams: URLSearchParams,
  openId: string | null,
  modifiersId: string | null
) {
  const params = new URLSearchParams(searchParams.toString());
  if (openId) params.set("open", openId);
  else params.delete("open");
  if (modifiersId) params.set("modifiers", modifiersId);
  else params.delete("modifiers");
  const q = params.toString();
  router.replace(q ? `/admin/categories?${q}` : "/admin/categories", { scroll: false });
}

export function CategoryList({
  categories,
  initialOpenId,
  initialModifiersId,
}: {
  categories: AdminCategory[];
  initialOpenId?: string;
  initialModifiersId?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [expandedId, setExpandedId] = useState<string | null>(initialOpenId ?? null);
  const [modifiersCategoryId, setModifiersCategoryId] = useState<string | null>(
    initialModifiersId ?? null
  );

  const modifiersCategory = categories.find((c) => c.id === modifiersCategoryId);

  const toggleExpanded = useCallback(
    (id: string) => {
      const next = expandedId === id ? null : id;
      setExpandedId(next);
      syncCategoryUrl(router, new URLSearchParams(searchParams.toString()), next, modifiersCategoryId);
    },
    [expandedId, modifiersCategoryId, router, searchParams]
  );

  const openModifiers = useCallback(
    (cat: AdminCategory) => {
      setExpandedId(cat.id);
      setModifiersCategoryId(cat.id);
      syncCategoryUrl(
        router,
        new URLSearchParams(searchParams.toString()),
        cat.id,
        cat.id
      );
    },
    [router, searchParams]
  );

  const closeModifiers = useCallback(() => {
    setModifiersCategoryId(null);
    syncCategoryUrl(
      router,
      new URLSearchParams(searchParams.toString()),
      expandedId,
      null
    );
  }, [expandedId, router, searchParams]);

  return (
    <>
      <SortableList
        items={categories}
        onReorder={reorderCategories}
        emptyMessage="Nog geen categorieën. Klik op + Nieuwe categorie om te beginnen."
        renderItem={(cat, handle) => {
          const isExpanded = expandedId === cat.id;

          return (
            <div
              className={`overflow-hidden rounded-xl border bg-white shadow-sm ${
                handle.isDragging ? "border-orange-300 ring-2 ring-orange-200" : "border-stone-200"
              } ${isExpanded ? "rounded-b-none border-b-0" : ""}`}
            >
              <div className="flex items-center gap-2 px-3 py-2.5">
                <SortableDragHandle {...handle} label={`Volgorde wijzigen: ${cat.name}`} />
                <button
                  type="button"
                  className="min-w-0 flex-1 text-left"
                  onClick={() => toggleExpanded(cat.id)}
                >
                  <span className="block truncate font-medium text-stone-900">{cat.name}</span>
                  <span className="text-xs text-stone-500">
                    {cat.productCount} product
                    {cat.productCount === 1 ? "" : "en"}
                    {cat.modifierGroups.length > 0
                      ? ` · ${cat.modifierGroups.length} optiegroep${cat.modifierGroups.length === 1 ? "" : "en"}`
                      : ""}
                  </span>
                </button>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                    cat.isActive
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-stone-100 text-stone-500"
                  }`}
                >
                  {cat.isActive ? "Actief" : "Uit"}
                </span>
                <button
                  type="button"
                  className={btnSecondary}
                  onClick={() => toggleExpanded(cat.id)}
                  aria-expanded={isExpanded}
                >
                  {isExpanded ? "Sluiten" : "Beheren"}
                </button>
              </div>

              {isExpanded && (
                <div className="border-t border-stone-200 bg-stone-50/60 px-4 py-4">
                  <form action={upsertCategory} className="grid gap-3 lg:grid-cols-2">
                    <input type="hidden" name="id" value={cat.id} />
                    <FormField label="Naam">
                      <input name="name" defaultValue={cat.name} required className={inputClass} />
                    </FormField>
                    <div className="lg:col-span-2">
                      <FormField label="Beschrijving">
                        <input
                          name="description"
                          defaultValue={cat.description ?? ""}
                          className={inputClass}
                        />
                      </FormField>
                    </div>
                    <CheckboxField
                      name="isActive"
                      label="Zichtbaar in menu"
                      defaultChecked={cat.isActive}
                    />
                    <div className="flex flex-wrap gap-2 lg:col-span-3">
                      <button type="submit" className={btnPrimary}>
                        Gegevens opslaan
                      </button>
                      <button
                        type="button"
                        className={btnSecondary}
                        onClick={() => openModifiers(cat)}
                      >
                        Extra opties
                        {cat.modifierGroups.length > 0
                          ? ` (${cat.modifierGroups.length})`
                          : ""}
                      </button>
                      <Link
                        href={`/admin/products?categoryId=${cat.id}`}
                        className={btnSecondary}
                      >
                        Producten
                      </Link>
                    </div>
                  </form>

                  <ConfirmDeleteForm
                    action={deleteCategory}
                    className="mt-4 border-t border-stone-200 pt-4"
                    message={
                      cat.productCount > 0
                        ? `"${cat.name}" verwijderen? Er staan nog ${cat.productCount} product(en) in deze categorie.`
                        : `"${cat.name}" verwijderen?`
                    }
                  >
                    <input type="hidden" name="id" value={cat.id} />
                    <button type="submit" className={btnDanger}>
                      Categorie verwijderen
                    </button>
                  </ConfirmDeleteForm>
                </div>
              )}
            </div>
          );
        }}
      />

      {modifiersCategory && (
        <CategoryModifiersOverlay
          open={Boolean(modifiersCategoryId)}
          onClose={closeModifiers}
          categoryName={modifiersCategory.name}
          categoryId={modifiersCategory.id}
          groups={modifiersCategory.modifierGroups}
        />
      )}
    </>
  );
}
