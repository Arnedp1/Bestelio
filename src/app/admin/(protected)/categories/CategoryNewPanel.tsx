import { btnPrimary, CheckboxField, FormField, inputClass } from "@/components/admin/FormField";
import { upsertCategory } from "../actions";

export function CategoryNewPanel() {
  return (
    <form action={upsertCategory} className="space-y-4">
      <FormField label="Naam">
        <input name="name" required className={inputClass} placeholder="bv. Snacks" autoFocus />
      </FormField>
      <CheckboxField name="isActive" label="Zichtbaar in menu" defaultChecked />
      <div className="flex justify-end border-t border-stone-200 pt-4">
        <button type="submit" className={btnPrimary}>
          Categorie toevoegen
        </button>
      </div>
    </form>
  );
}
