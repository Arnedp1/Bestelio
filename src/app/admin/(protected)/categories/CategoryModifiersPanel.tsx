import { ConfirmDeleteForm } from "@/components/admin/ConfirmDeleteForm";
import {
  btnDanger,
  btnPrimary,
  btnSecondary,
  FormField,
  inputClass,
} from "@/components/admin/FormField";
import {
  addCategoryModifierGroup,
  addCategoryModifierOption,
  deleteCategoryModifierGroup,
  deleteCategoryModifierOption,
  updateCategoryModifierGroup,
} from "../actions";
import {
  CategoryModifierGroupFields,
  isMultipleModifierGroup,
} from "./CategoryModifierGroupFields";

export type CategoryModifierGroupWithOptions = {
  id: string;
  name: string;
  maxSelections: number;
  isRequired: boolean;
  options: { id: string; name: string; priceCents: number }[];
};

function selectionLabel(maxSelections: number, isRequired: boolean): string {
  const mode = isMultipleModifierGroup(maxSelections) ? "meerdere opties" : "enkele keuze";
  return isRequired ? `${mode} · verplicht` : mode;
}

export function CategoryModifiersPanel({
  categoryId,
  groups,
}: {
  categoryId: string;
  groups: CategoryModifierGroupWithOptions[];
}) {
  return (
    <div className="space-y-6">
      <form
        action={addCategoryModifierGroup}
        className="space-y-4 rounded-xl border border-dashed border-stone-300 bg-white p-5"
      >
        <input type="hidden" name="categoryId" value={categoryId} />
        <FormField label="Nieuwe groep">
          <input
            name="name"
            placeholder="bv. Saus of Drank"
            required
            className={inputClass}
          />
        </FormField>
        <CategoryModifierGroupFields />
        <button type="submit" className={btnPrimary}>
          Groep toevoegen
        </button>
      </form>

      {groups.length === 0 ? (
        <p className="text-sm text-stone-500">
          Nog geen extra opties. Klanten zien bij producten in deze categorie geen keuzescherm.
        </p>
      ) : (
        <ul className="space-y-4">
          {groups.map((g) => (
            <li
              key={g.id}
              className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm"
            >
              <form action={updateCategoryModifierGroup} className="space-y-4 border-b border-stone-100 pb-4">
                <input type="hidden" name="id" value={g.id} />
                <input type="hidden" name="categoryId" value={categoryId} />
                <div className="flex flex-wrap items-end justify-between gap-2">
                  <div className="min-w-[10rem] flex-1">
                    <FormField label="Groepnaam">
                      <input name="name" defaultValue={g.name} required className={inputClass} />
                    </FormField>
                  </div>
                  <button type="submit" className={btnSecondary}>
                    Instellingen opslaan
                  </button>
                </div>
                <CategoryModifierGroupFields
                  compact
                  allowMultiple={isMultipleModifierGroup(g.maxSelections)}
                  isRequired={g.isRequired}
                />
                <p className="text-xs text-stone-500">
                  Klant ziet: {selectionLabel(g.maxSelections, g.isRequired)}
                </p>
              </form>

              <div className="flex justify-end pt-2">
                <ConfirmDeleteForm
                  action={deleteCategoryModifierGroup}
                  message={`Groep "${g.name}" en alle opties verwijderen?`}
                >
                  <input type="hidden" name="id" value={g.id} />
                  <input type="hidden" name="categoryId" value={categoryId} />
                  <button type="submit" className={btnDanger}>
                    Groep verwijderen
                  </button>
                </ConfirmDeleteForm>
              </div>

              {g.options.length > 0 && (
                <ul className="mt-3 divide-y divide-stone-100 text-sm">
                  {g.options.map((o) => (
                    <li key={o.id} className="flex items-center justify-between gap-2 py-1.5">
                      <span>
                        {o.name}
                        <span className="text-stone-500">
                          {" "}
                          (+€ {(o.priceCents / 100).toFixed(2)})
                        </span>
                      </span>
                      <ConfirmDeleteForm
                        action={deleteCategoryModifierOption}
                        message={`"${o.name}" verwijderen?`}
                      >
                        <input type="hidden" name="id" value={o.id} />
                        <input type="hidden" name="categoryId" value={categoryId} />
                        <button
                          type="submit"
                          className="text-xs font-medium text-red-600 hover:underline"
                        >
                          Verwijderen
                        </button>
                      </ConfirmDeleteForm>
                    </li>
                  ))}
                </ul>
              )}
              <form action={addCategoryModifierOption} className="mt-4 flex flex-wrap items-end gap-3">
                <input type="hidden" name="groupId" value={g.id} />
                <input type="hidden" name="categoryId" value={categoryId} />
                <div className="min-w-[8rem] flex-1">
                  <FormField label="Optie">
                    <input name="name" placeholder="Naam" required className={inputClass} />
                  </FormField>
                </div>
                <div className="w-24">
                  <FormField label="€">
                    <input
                      name="priceEuro"
                      type="number"
                      step="0.01"
                      min="0"
                      defaultValue="0"
                      className={inputClass}
                    />
                  </FormField>
                </div>
                <button type="submit" className={btnPrimary}>
                  Optie +
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
