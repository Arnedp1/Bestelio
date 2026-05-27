"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { checkoutFieldErrors, checkoutSchema } from "@/lib/validations/checkout";
import type { PaymentMode } from "@/lib/payments/resolve";
import { DatePicker, checkoutDateBounds } from "@/components/ui/DatePicker";
import { isoDateFromDate } from "@/lib/dates/calendar";

type Slot = { id: string; startsAt: string; endsAt: string };

function fieldInputClass(hasError: boolean) {
  return `input-field mt-1 ${hasError ? "input-field-error" : ""}`;
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs font-medium text-red-600">{message}</p>;
}

export function CheckoutForm({
  pickupEnabled,
  deliveryEnabled,
  onlinePaymentsEnabled,
  requireOnlinePayment,
  minOrderCents,
  paymentMode = "off",
  canPayOnline = false,
  allowOnlinePayment = true,
}: {
  pickupEnabled: boolean;
  deliveryEnabled: boolean;
  onlinePaymentsEnabled: boolean;
  requireOnlinePayment: boolean;
  minOrderCents: number;
  paymentMode?: PaymentMode;
  canPayOnline?: boolean;
  allowOnlinePayment?: boolean;
}) {
  const router = useRouter();
  const [fulfillment, setFulfillment] = useState<"PICKUP" | "DELIVERY">(
    pickupEnabled ? "PICKUP" : "DELIVERY"
  );
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotId, setSlotId] = useState("");
  const showPaymentSection = allowOnlinePayment && onlinePaymentsEnabled;
  const forceOnlinePayment = showPaymentSection && requireOnlinePayment;
  const [payOnline, setPayOnline] = useState(
    () => showPaymentSection && (forceOnlinePayment || onlinePaymentsEnabled)
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [date, setDate] = useState(() => isoDateFromDate(new Date()));
  const dateBounds = checkoutDateBounds(30);

  function clearField(name: string) {
    setFieldErrors((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  }

  useEffect(() => {
    fetch(`/api/slots/available?fulfillment=${fulfillment}&date=${date}`)
      .then((r) => r.json())
      .then((data) => {
        setSlots(data.slots ?? []);
        setSlotId(data.slots?.[0]?.id ?? "");
      });
  }, [fulfillment, date]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    const fd = new FormData(e.currentTarget);
    const payload = {
      customerName: String(fd.get("customerName") ?? ""),
      customerPhone: String(fd.get("customerPhone") ?? ""),
      customerEmail: String(fd.get("customerEmail") ?? ""),
      customerAddress:
        fulfillment === "DELIVERY" ? String(fd.get("customerAddress") ?? "") : undefined,
      notes: String(fd.get("notes") ?? "") || undefined,
      fulfillment,
      timeSlotInstanceId: slotId,
      payOnline: allowOnlinePayment ? (forceOnlinePayment || payOnline) && canPayOnline : false,
    };

    const parsed = checkoutSchema.safeParse(payload);
    if (!parsed.success) {
      setFieldErrors(checkoutFieldErrors(parsed.error));
      setError(null);
      return;
    }

    if (!slotId) {
      setFieldErrors({ timeSlotInstanceId: "Kies een beschikbaar tijdslot." });
      setError(null);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      let data: {
        orderId?: string;
        checkoutUrl?: string;
        reason?: string;
        message?: string;
        fieldErrors?: Record<string, string>;
        minOrderCents?: number;
      } = {};

      try {
        data = await res.json();
      } catch {
        data = {};
      }

      if (!res.ok) {
        if (data.reason === "validation" && data.fieldErrors) {
          setFieldErrors(data.fieldErrors);
          setError(null);
          return;
        }
        if (data.reason === "min_order" && data.minOrderCents != null) {
          setError(`Minimum bestelling is € ${(data.minOrderCents / 100).toFixed(2)}.`);
          return;
        }
        if (data.reason === "invalid_cart") {
          setError(
            data.message ??
              "Je winkelmand is verouderd. Ga terug naar het menu en voeg je producten opnieuw toe."
          );
          return;
        }
        if (data.reason === "payment_not_configured") {
          setError(
            data.message ??
              "Online betalen is verplicht maar niet beschikbaar. Probeer later opnieuw."
          );
          return;
        }
        if (data.reason === "payment_failed") {
          setError(
            data.message ??
              "Online betalen mislukt. Probeer opnieuw of bestel zonder online betaling."
          );
          if (data.orderId) {
            router.push(`/order/${data.orderId}`);
          }
          return;
        }
        setError(data.message ?? "Bestelling mislukt. Probeer opnieuw.");
        return;
      }

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }

      if (data.orderId) {
        router.push(`/order/${data.orderId}`);
        return;
      }

      setError("Onverwacht antwoord van de server. Probeer opnieuw.");
    } catch {
      setError("Geen verbinding met de server. Probeer opnieuw.");
    } finally {
      setLoading(false);
    }
  }

  function formatSlot(s: Slot) {
    return new Date(s.startsAt).toLocaleTimeString("nl-BE", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  const showFormError = error && Object.keys(fieldErrors).length === 0;

  return (
    <form onSubmit={handleSubmit} className="card mt-6 space-y-5 p-6" noValidate>
      <div>
        <p className="mb-3 text-sm font-semibold text-stone-700">Hoe wil je ontvangen?</p>
        <div className="flex flex-wrap gap-2">
          {pickupEnabled && (
            <button
              type="button"
              onClick={() => {
                setFulfillment("PICKUP");
                clearField("customerAddress");
                clearField("fulfillment");
              }}
              className={fulfillment === "PICKUP" ? "chip chip-active" : "chip chip-inactive"}
            >
              🏪 Afhalen
            </button>
          )}
          {deliveryEnabled && (
            <button
              type="button"
              onClick={() => {
                setFulfillment("DELIVERY");
                clearField("fulfillment");
              }}
              className={
                fulfillment === "DELIVERY" ? "chip chip-active" : "chip chip-inactive"
              }
            >
              🚗 Leveren
            </button>
          )}
        </div>
        <FieldError message={fieldErrors.fulfillment} />
      </div>

      <label className="block">
        <span className="text-sm font-semibold text-stone-700">Datum</span>
        <DatePicker
          size="compact"
          value={date}
          onChange={(next) => {
            setDate(next);
            clearField("timeSlotInstanceId");
          }}
          min={dateBounds.min}
          max={dateBounds.max}
          className={fieldInputClass(false)}
        />
      </label>

      <label className="block">
        <span className="text-sm font-semibold text-stone-700">Tijdslot</span>
        <select
          value={slotId}
          onChange={(e) => {
            setSlotId(e.target.value);
            clearField("timeSlotInstanceId");
          }}
          className={`select-field ${fieldInputClass(!!fieldErrors.timeSlotInstanceId)}`}
          aria-invalid={!!fieldErrors.timeSlotInstanceId}
          aria-describedby={fieldErrors.timeSlotInstanceId ? "slot-error" : undefined}
        >
          {slots.length === 0 && <option value="">Geen slots beschikbaar</option>}
          {slots.map((s) => (
            <option key={s.id} value={s.id}>
              {formatSlot(s)}
            </option>
          ))}
        </select>
        <FieldError message={fieldErrors.timeSlotInstanceId} />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className="text-sm font-semibold text-stone-700">Naam</span>
          <input
            name="customerName"
            className={fieldInputClass(!!fieldErrors.customerName)}
            placeholder="Jan Janssen"
            aria-invalid={!!fieldErrors.customerName}
            onChange={() => clearField("customerName")}
          />
          <FieldError message={fieldErrors.customerName} />
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-stone-700">Telefoon</span>
          <input
            name="customerPhone"
            className={fieldInputClass(!!fieldErrors.customerPhone)}
            placeholder="04xx xx xx xx"
            aria-invalid={!!fieldErrors.customerPhone}
            onChange={() => clearField("customerPhone")}
          />
          <FieldError message={fieldErrors.customerPhone} />
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-stone-700">E-mail (optioneel)</span>
          <input
            name="customerEmail"
            type="email"
            className={fieldInputClass(!!fieldErrors.customerEmail)}
            aria-invalid={!!fieldErrors.customerEmail}
            onChange={() => clearField("customerEmail")}
          />
          <FieldError message={fieldErrors.customerEmail} />
        </label>
        {fulfillment === "DELIVERY" && (
          <label className="block sm:col-span-2">
            <span className="text-sm font-semibold text-stone-700">Adres</span>
            <input
              name="customerAddress"
              className={fieldInputClass(!!fieldErrors.customerAddress)}
              aria-invalid={!!fieldErrors.customerAddress}
              onChange={() => clearField("customerAddress")}
            />
            <FieldError message={fieldErrors.customerAddress} />
          </label>
        )}
        <label className="block sm:col-span-2">
          <span className="text-sm font-semibold text-stone-700">Opmerkingen</span>
          <textarea
            name="notes"
            rows={2}
            className={fieldInputClass(!!fieldErrors.notes)}
            placeholder="Extra saus, bel aan…"
            aria-invalid={!!fieldErrors.notes}
            onChange={() => clearField("notes")}
          />
          <FieldError message={fieldErrors.notes} />
        </label>
      </div>

      {showPaymentSection && (
        <div className="rounded-xl border border-stone-200 bg-stone-50 p-4">
          {forceOnlinePayment ? (
            canPayOnline ? (
              <p className="text-sm text-stone-700">
                <span className="font-semibold text-stone-900">Online betalen is verplicht.</span>
                {paymentMode === "mollie" && (
                  <span className="mt-1 block text-xs text-stone-500">
                    Na het plaatsen van je bestelling ga je naar het beveiligde Mollie-betaalscherm.
                  </span>
                )}
                {paymentMode === "simulate" && (
                  <span className="mt-1 block text-xs text-amber-700">
                    Demo-modus: geen Mollie-scherm (API-key ontbreekt in admin).
                  </span>
                )}
              </p>
            ) : (
              <p className="text-sm text-red-700">
                Online betalen is verplicht, maar Mollie is niet geconfigureerd. De zaak moet
                eerst een API-key instellen onder Admin → Instellingen.
              </p>
            )
          ) : canPayOnline ? (
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={payOnline}
                onChange={(e) => setPayOnline(e.target.checked)}
                className="checkbox"
              />
              <span>
                Nu online betalen
                {paymentMode === "mollie" && (
                  <span className="mt-0.5 block text-xs font-normal text-stone-500">
                    Je wordt doorgestuurd naar het beveiligde Mollie-betaalscherm.
                  </span>
                )}
                {paymentMode === "simulate" && (
                  <span className="mt-0.5 block text-xs font-normal text-amber-700">
                    Demo-modus: geen Mollie-scherm. Vul een API-key in bij Admin → Instellingen.
                  </span>
                )}
              </span>
            </label>
          ) : (
            <p className="text-sm text-red-700">
              Online betalen staat aan, maar Mollie is niet geconfigureerd. Ga naar{" "}
              <strong>Admin → Instellingen</strong> en vul je <strong>test_</strong> API-key in,
              of zet <code className="text-xs">MOLLIE_API_KEY</code> in <code className="text-xs">.env</code>.
            </p>
          )}
        </div>
      )}

      {minOrderCents > 0 && (
        <p className="text-sm text-stone-500">
          Minimum: € {(minOrderCents / 100).toFixed(2).replace(".", ",")}
        </p>
      )}

      {showFormError && (
        <div
          className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
          role="alert"
        >
          <p>{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !slotId || (forceOnlinePayment && !canPayOnline)}
        className="btn-primary w-full"
      >
        {loading
          ? "Bestelling plaatsen…"
          : forceOnlinePayment && canPayOnline
            ? "Bestellen en online betalen"
            : "Bestelling bevestigen"}
      </button>
    </form>
  );
}
