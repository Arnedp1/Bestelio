import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin/session";
import { getPaymentSetup } from "@/lib/payments/resolve";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminCard } from "@/components/admin/AdminCard";
import { btnPrimary, CheckboxField, FormField, inputClass } from "@/components/admin/FormField";
import { saveBrandSettings, saveBusinessSettings } from "../actions";
import { PaymentSettingsFields } from "./PaymentSettingsFields";

export default async function AdminSettingsPage() {
  const { tenantId } = await requireAdmin();
  const [brand, business, paymentSetup] = await Promise.all([
    prisma.brandSettings.findUnique({ where: { tenantId } }),
    prisma.businessSettings.findUnique({ where: { tenantId } }),
    getPaymentSetup(tenantId),
  ]);

  const mollieStatus =
    paymentSetup.mode === "mollie"
      ? "Mollie actief — klanten zien het echte betaalscherm."
      : paymentSetup.mode === "simulate"
        ? "Demo-modus (geen Mollie-scherm). Vul hieronder een test API-key in."
        : "Niet geconfigureerd — vul een Mollie test API-key in.";

  return (
    <div>
      <AdminPageHeader
        title="Instellingen"
        description="Branding, bestelregels en betalingen"
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <AdminCard title="Branding" description="Hoe je shop eruitziet voor klanten">
          <form action={saveBrandSettings} className="space-y-4">
            <FormField label="Weergavenaam">
              <input
                name="displayName"
                required
                defaultValue={brand?.displayName ?? ""}
                className={inputClass}
              />
            </FormField>
            <FormField label="Primaire kleur">
              <div className="flex items-center gap-3">
                <input
                  name="primaryColor"
                  type="color"
                  defaultValue={brand?.primaryColor ?? "#ea580c"}
                  className="h-11 w-14 cursor-pointer rounded-lg border border-stone-200"
                />
                <span className="text-sm text-stone-500">Accent op knoppen en header</span>
              </div>
            </FormField>
            <FormField label="Logo URL">
              <input name="logoUrl" defaultValue={brand?.logoUrl ?? ""} className={inputClass} />
            </FormField>
            <button type="submit" className={btnPrimary}>
              Branding opslaan
            </button>
          </form>
        </AdminCard>

        <AdminCard title="Bestelgedrag" description="Afhalen, leveren en betalingen">
          <form action={saveBusinessSettings} className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <CheckboxField
                name="pickupEnabled"
                label="Afhalen"
                defaultChecked={business?.pickupEnabled ?? true}
                box
              />
              <CheckboxField
                name="deliveryEnabled"
                label="Leveren"
                defaultChecked={business?.deliveryEnabled ?? false}
                box
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField label="Minimum (€)">
                <input
                  name="minOrderEuro"
                  type="number"
                  step="0.01"
                  defaultValue={(business?.minOrderCents ?? 0) / 100}
                  className={inputClass}
                />
              </FormField>
              <FormField label="Vooruitbestellen (min)">
                <input
                  name="orderLeadMinutes"
                  type="number"
                  defaultValue={business?.orderLeadMinutes ?? 30}
                  className={inputClass}
                />
              </FormField>
              <FormField label="Slot-interval (min)">
                <input
                  name="slotIntervalMinutes"
                  type="number"
                  defaultValue={business?.slotIntervalMinutes ?? 15}
                  className={inputClass}
                />
                <p className="mt-1 text-xs text-stone-500">
                  Standaardwaarde; per tijdslot-regel kun je dit overschrijven onder Tijdslots.
                </p>
              </FormField>
            </div>

            <div className="rounded-xl border border-stone-200 bg-stone-50 p-4 space-y-4">
              <p
                className={`text-sm font-medium ${
                  paymentSetup.mode === "mollie"
                    ? "text-emerald-700"
                    : paymentSetup.mode === "simulate"
                      ? "text-amber-700"
                      : "text-red-700"
                }`}
              >
                {mollieStatus}
              </p>

              <PaymentSettingsFields
                onlinePaymentsEnabled={business?.onlinePaymentsEnabled ?? false}
                requireOnlinePayment={business?.requireOnlinePayment ?? false}
                paymentProvider={business?.paymentProvider ?? "MANUAL"}
                hasStoredKey={Boolean(business?.mollieApiKey)}
              />
            </div>

            <button type="submit" className={btnPrimary}>
              Instellingen opslaan
            </button>
          </form>
        </AdminCard>
      </div>
    </div>
  );
}
