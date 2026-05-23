"use client";

import { useState } from "react";
import { CheckboxField, FormField, inputClass } from "@/components/admin/FormField";

export function PaymentSettingsFields({
  onlinePaymentsEnabled: initialOnline,
  requireOnlinePayment: initialRequire,
  paymentProvider: initialProvider,
  hasStoredKey,
}: {
  onlinePaymentsEnabled: boolean;
  requireOnlinePayment: boolean;
  paymentProvider: string;
  hasStoredKey: boolean;
}) {
  const [onlineEnabled, setOnlineEnabled] = useState(initialOnline);
  const [requireOnline, setRequireOnline] = useState(initialRequire);
  const [provider, setProvider] = useState(initialProvider);

  function onRequireChange(checked: boolean) {
    setRequireOnline(checked);
    if (checked) {
      setOnlineEnabled(true);
      setProvider("MOLLIE");
    }
  }

  return (
    <>
      <CheckboxField
        name="onlinePaymentsEnabled"
        label="Online betalen inschakelen"
        checked={onlineEnabled}
        onChange={(e) => setOnlineEnabled(e.target.checked)}
      />
      <CheckboxField
        name="requireOnlinePayment"
        label="Online betalen verplicht (klant kan niet kiezen om later te betalen)"
        checked={requireOnline}
        onChange={(e) => onRequireChange(e.target.checked)}
      />
      <p className="-mt-2 text-xs text-stone-500">
        Bij verplicht online betalen worden online betalen en Mollie automatisch ingeschakeld.
      </p>
      <input type="hidden" name="paymentProvider" value={provider} />
      <FormField label="Provider">
        <select
          value={provider}
          onChange={(e) => setProvider(e.target.value)}
          className={`${inputClass} mt-2`}
          disabled={requireOnline}
          aria-disabled={requireOnline}
        >
          <option value="MANUAL">Handmatig / bij afhalen</option>
          <option value="MOLLIE">Mollie</option>
        </select>
      </FormField>

      <FormField label="Mollie API-key (test_… of live_…)">
        <input
          name="mollieApiKey"
          type="password"
          autoComplete="off"
          placeholder={
            hasStoredKey
              ? "•••••••• (ingevuld — leeg laten = behouden)"
              : "test_xxxxxxxxxxxxxxxxxxxxxxxxxxxx"
          }
          className={inputClass}
        />
        <p className="mt-1 text-xs text-stone-500">
          Test-key uit{" "}
          <a
            href="https://my.mollie.com/dashboard/developers/api-keys"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-orange-600 hover:underline"
          >
            Mollie Dashboard
          </a>
          . Testmodus kost geen echt geld.
        </p>
      </FormField>

      {hasStoredKey && (
        <CheckboxField name="clearMollieApiKey" label="Opgeslagen API-key verwijderen" />
      )}
    </>
  );
}
