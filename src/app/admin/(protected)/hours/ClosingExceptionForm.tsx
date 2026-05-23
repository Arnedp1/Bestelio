"use client";

import { addClosingException } from "../actions";
import { btnPrimary, CheckboxField, FormField, inputClass } from "@/components/admin/FormField";
import { DatePicker } from "@/components/ui/DatePicker";
import { addDaysIso, isoDateFromDate } from "@/lib/dates/calendar";

export function ClosingExceptionForm() {
  const today = isoDateFromDate(new Date());

  return (
    <form action={addClosingException} className="space-y-3">
      <FormField label="Datum">
        <DatePicker
          name="date"
          required
          defaultValue={today}
          min={addDaysIso(today, -365)}
          max={addDaysIso(today, 730)}
          className={inputClass}
        />
      </FormField>
      <FormField label="Reden (optioneel)">
        <input name="reason" placeholder="Feestdag, vakantie…" className={inputClass} />
      </FormField>
      <CheckboxField name="isClosed" label="Hele dag gesloten" defaultChecked />
      <div className="pt-4">
        <button type="submit" className={`${btnPrimary} w-full`}>
          Toevoegen
        </button>
      </div>
    </form>
  );
}
