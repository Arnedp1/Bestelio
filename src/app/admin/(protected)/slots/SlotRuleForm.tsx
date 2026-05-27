import type { TimeSlotRule } from "@prisma/client";
import type { FulfillmentType } from "@prisma/client";
import { btnPrimary, CheckboxField, FormField, inputClass } from "@/components/admin/FormField";
import { upsertTimeSlotRule } from "../actions";

export function SlotRuleForm({
  fulfillment,
  rule,
}: {
  fulfillment: FulfillmentType;
  rule: TimeSlotRule | null;
}) {
  return (
    <form action={upsertTimeSlotRule} className="space-y-3">
      <input type="hidden" name="fulfillment" value={fulfillment} />

      <div className="grid grid-cols-2 gap-2">
        <FormField label="Van">
          <input
            name="startTime"
            type="text"
            inputMode="numeric"
            defaultValue={rule?.startTime ?? "11:00"}
            required
            autoComplete="off"
            placeholder="11:00 of 11"
            title="HH:MM of alleen uur, bijv. 11:00 of 11"
            className={inputClass}
          />
        </FormField>
        <FormField label="Tot">
          <input
            name="endTime"
            type="text"
            inputMode="numeric"
            defaultValue={rule?.endTime ?? "22:00"}
            required
            autoComplete="off"
            placeholder="22:00 of 22"
            title="HH:MM of alleen uur, bijv. 22:00 of 22"
            className={inputClass}
          />
        </FormField>
      </div>
      <FormField label="Elke X minuten een slot">
        <input
          name="intervalMinutes"
          type="number"
          defaultValue={rule?.intervalMinutes ?? 15}
          className={inputClass}
        />
      </FormField>
      <FormField label="Max. omzet per slot (€)">
        <input
          name="maxRevenueEuro"
          type="number"
          step="0.01"
          min="1"
          defaultValue={((rule?.maxOrders ?? 15000) / 100).toFixed(2)}
          className={inputClass}
        />
      </FormField>
      <CheckboxField name="isActive" label="Tijdslots actief" defaultChecked={rule?.isActive ?? true} />
      <button type="submit" className={`${btnPrimary} w-full`}>
        Opslaan
      </button>
    </form>
  );
}
