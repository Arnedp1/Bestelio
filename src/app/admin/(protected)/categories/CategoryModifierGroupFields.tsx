import { CheckboxField } from "@/components/admin/FormField";
import { isMultipleModifierGroup } from "@/lib/modifiers/selection";

export { isMultipleModifierGroup };

export function CategoryModifierGroupFields({
  allowMultiple = false,
  isRequired = false,
  compact = false,
}: {
  allowMultiple?: boolean;
  isRequired?: boolean;
  compact?: boolean;
}) {
  return (
    <div className={`grid gap-3 ${compact ? "sm:grid-cols-2" : "sm:grid-cols-2"}`}>
      <CheckboxField
        name="allowMultiple"
        label="Meerdere opties tegelijk"
        defaultChecked={allowMultiple}
      />
      <CheckboxField name="isRequired" label="Verplicht kiezen" defaultChecked={isRequired} />
      {!compact && (
        <p className="text-xs text-stone-500 sm:col-span-2">
          Uit = klant kiest maximaal één optie. Aan = klant mag meerdere opties combineren (bv.
          meerdere sauzen).
        </p>
      )}
    </div>
  );
}
