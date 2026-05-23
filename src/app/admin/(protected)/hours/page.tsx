import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin/session";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminCard } from "@/components/admin/AdminCard";
import { ConfirmDeleteForm } from "@/components/admin/ConfirmDeleteForm";
import {
  btnDanger,
  btnPrimary,
  CheckboxField,
  FormField,
  inputClass,
} from "@/components/admin/FormField";
import { deleteClosingException, saveOpeningHour } from "../actions";
import { ClosingExceptionForm } from "./ClosingExceptionForm";

const DAYS = ["Zondag", "Maandag", "Dinsdag", "Woensdag", "Donderdag", "Vrijdag", "Zaterdag"];

export default async function AdminHoursPage() {
  const { tenantId } = await requireAdmin();
  const [hours, exceptions] = await Promise.all([
    prisma.openingHour.findMany({ where: { tenantId }, orderBy: { dayOfWeek: "asc" } }),
    prisma.closingException.findMany({
      where: { tenantId },
      orderBy: { date: "desc" },
      take: 20,
    }),
  ]);

  const hourMap = new Map(hours.map((h) => [h.dayOfWeek, h]));

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Openingstijden"
        description="Weekschema en sluitingsdagen"
      />

      <AdminCard title="Weekschema">
        <div className="space-y-2">
          {DAYS.map((label, dayOfWeek) => {
            const h = hourMap.get(dayOfWeek);
            const closed = h?.isClosed ?? false;
            return (
              <form
                key={dayOfWeek}
                action={saveOpeningHour}
                className={`grid items-end gap-3 rounded-xl border p-4 sm:grid-cols-[1fr_1fr_1fr_auto_auto] ${
                  closed ? "border-red-200 bg-red-50/30" : "border-stone-200 bg-white"
                }`}
              >
                <input type="hidden" name="dayOfWeek" value={dayOfWeek} />
                <div>
                  <span className="text-sm font-semibold text-stone-900">{label}</span>
                </div>
                <FormField label="Open">
                  <input
                    name="openTime"
                    defaultValue={h?.openTime ?? "11:00"}
                    className={`${inputClass} ${closed ? "opacity-60" : ""}`}
                    readOnly={closed}
                    aria-disabled={closed}
                  />
                </FormField>
                <FormField label="Sluit">
                  <input
                    name="closeTime"
                    defaultValue={h?.closeTime ?? "22:00"}
                    className={`${inputClass} ${closed ? "opacity-60" : ""}`}
                    readOnly={closed}
                    aria-disabled={closed}
                  />
                </FormField>
                <CheckboxField name="isClosed" label="Gesloten" defaultChecked={closed} className="pb-2" />
                <button type="submit" className={btnPrimary}>
                  Opslaan
                </button>
              </form>
            );
          })}
        </div>
      </AdminCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <AdminCard title="Uitzonderlijke sluitingsdag toevoegen">
          <ClosingExceptionForm />
        </AdminCard>

        <AdminCard title="Uitzonderingen" description={`${exceptions.length} geregistreerd`}>
          {exceptions.length === 0 ? (
            <p className="text-sm text-stone-500">Geen uitzonderingen.</p>
          ) : (
            <ul className="divide-y divide-stone-100">
              {exceptions.map((ex) => (
                <li key={ex.id} className="flex items-center justify-between py-3 text-sm">
                  <div>
                    <span className="font-medium text-stone-900">
                      {ex.date.toLocaleDateString("nl-BE")}
                    </span>
                    {ex.reason && (
                      <span className="ml-2 text-stone-500">{ex.reason}</span>
                    )}
                    <span
                      className={`ml-2 text-xs font-medium ${ex.isClosed ? "text-red-600" : "text-emerald-600"}`}
                    >
                      {ex.isClosed ? "Gesloten" : "Open"}
                    </span>
                  </div>
                  <ConfirmDeleteForm
                    action={deleteClosingException}
                    message="Weet je zeker dat je deze uitzondering wilt verwijderen?"
                  >
                    <input type="hidden" name="id" value={ex.id} />
                    <button type="submit" className={btnDanger}>
                      ×
                    </button>
                  </ConfirmDeleteForm>
                </li>
              ))}
            </ul>
          )}
        </AdminCard>
      </div>
    </div>
  );
}
