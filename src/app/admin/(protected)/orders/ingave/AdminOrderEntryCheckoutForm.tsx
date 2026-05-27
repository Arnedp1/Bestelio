"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DatePicker, checkoutDateBounds } from "@/components/ui/DatePicker";
import { isoDateFromDate } from "@/lib/dates/calendar";
import {
  fetchAvailableSlotsForDate,
  fetchFirstAvailableSlots,
} from "@/lib/slots/fetch-first-available";

type Slot = { id: string; startsAt: string; endsAt: string };

function fieldInputClass(hasError: boolean) {
  return `input-field mt-1 ${hasError ? "input-field-error" : ""}`;
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs font-medium text-red-600">{message}</p>;
}

export function AdminOrderEntryCheckoutForm({
  pickupEnabled,
  deliveryEnabled,
  minOrderCents,
}: {
  pickupEnabled: boolean;
  deliveryEnabled: boolean;
  minOrderCents: number;
}) {
  const router = useRouter();
  const [fulfillment, setFulfillment] = useState<"PICKUP" | "DELIVERY">(
    pickupEnabled ? "PICKUP" : "DELIVERY"
  );
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotId, setSlotId] = useState("");
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
    let cancelled = false;
    void fetchFirstAvailableSlots(fulfillment).then(({ date: firstDate, slots }) => {
      if (cancelled) return;
      setDate(firstDate);
      setSlots(slots);
      setSlotId(slots[0]?.id ?? "");
    });
    return () => {
      cancelled = true;
    };
  }, [fulfillment]);

  async function loadSlotsForDate(nextDate: string, nextFulfillment = fulfillment) {
    const list = await fetchAvailableSlotsForDate(nextFulfillment, nextDate);
    setSlots(list);
    setSlotId(list[0]?.id ?? "");
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    if (!slotId) {
      setFieldErrors({ timeSlotInstanceId: "Kies een beschikbaar tijdslot." });
      return;
    }

    const fd = new FormData(e.currentTarget);
    const payload = {
      customerName: String(fd.get("customerName") ?? "") || undefined,
      customerPhone: String(fd.get("customerPhone") ?? "") || undefined,
      customerEmail: String(fd.get("customerEmail") ?? "") || undefined,
      customerAddress:
        fulfillment === "DELIVERY" ? String(fd.get("customerAddress") ?? "") : undefined,
      notes: String(fd.get("notes") ?? "") || undefined,
      fulfillment,
      timeSlotInstanceId: slotId,
    };

    setLoading(true);
    try {
      const res = await fetch("/api/admin/orders/entry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        reason?: string;
        message?: string;
        minOrderCents?: number;
        issues?: { fieldErrors?: Record<string, string[]> };
      };

      if (!res.ok) {
        if (data.reason === "validation" && data.issues?.fieldErrors) {
          const firstErrors = Object.fromEntries(
            Object.entries(data.issues.fieldErrors).map(([k, v]) => [k, v[0]])
          );
          setFieldErrors(firstErrors);
          return;
        }
        if (data.reason === "min_order" && data.minOrderCents != null) {
          setError(`Minimum bestelling is € ${(data.minOrderCents / 100).toFixed(2)}.`);
          return;
        }
        setError(data.message ?? "Bestelling aanmaken mislukt.");
        return;
      }

      router.push("/admin/orders");
      router.refresh();
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

  return (
    <form onSubmit={handleSubmit} className="card mt-0 space-y-5 p-6" noValidate>
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
              className={fulfillment === "DELIVERY" ? "chip chip-active" : "chip chip-inactive"}
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
            void loadSlotsForDate(next);
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
          <span className="text-sm font-semibold text-stone-700">Naam (optioneel)</span>
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
          <span className="text-sm font-semibold text-stone-700">Telefoon (optioneel)</span>
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

      {minOrderCents > 0 && (
        <p className="text-sm text-stone-500">
          Minimum: € {(minOrderCents / 100).toFixed(2).replace(".", ",")}
        </p>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          <p>{error}</p>
        </div>
      )}

      <button type="submit" disabled={loading || !slotId} className="btn-primary w-full">
        {loading ? "Bestelling aanmaken…" : "Bestelling toevoegen"}
      </button>
    </form>
  );
}
