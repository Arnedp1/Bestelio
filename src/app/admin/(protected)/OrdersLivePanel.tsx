"use client";

import { useCallback, useEffect, useState } from "react";
import type { AdminOrdersSnapshot } from "@/lib/admin/orders";
import { formatCents } from "@/lib/utils/money";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { StatusBadge } from "@/components/admin/StatusBadge";
import {
  adminOrderBadgeKey,
  adminOrderStatusLabel,
} from "@/lib/admin/order-display";
import { OrderStatusActions } from "./OrderStatusActions";

const POLL_MS = 5_000;
const TRIGGER_PRINT_EVENT = "kitchen-print-now";

function formatOrderTime(iso: string) {
  return new Date(iso).toLocaleString("nl-BE", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function OrdersLivePanel({
  initial,
}: {
  initial: AdminOrdersSnapshot;
}) {
  const [snapshot, setSnapshot] = useState(initial);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(
    initial.orders[0]?.id ?? null
  );
  const [lastSync, setLastSync] = useState(() => new Date());
  const [syncing, setSyncing] = useState(false);
  const [printingKitchen, setPrintingKitchen] = useState(false);
  const [printingVat, setPrintingVat] = useState(false);

  const fetchOrders = useCallback(async () => {
    setSyncing(true);
    try {
      const res = await fetch("/api/admin/orders", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as AdminOrdersSnapshot;
      setSnapshot(data);
      setLastSync(new Date());
    } finally {
      setSyncing(false);
    }
  }, []);

  useEffect(() => {
    const tick = () => {
      if (document.visibilityState === "visible") void fetchOrders();
    };

    tick();
    const id = window.setInterval(tick, POLL_MS);

    const onVisibility = () => {
      if (document.visibilityState === "visible") tick();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [fetchOrders]);

  const { orders, openCount, todayRevenueCents } = snapshot;
  const selectedOrder =
    orders.find((order) => order.id === selectedOrderId) ?? orders[0] ?? null;

  useEffect(() => {
    if (orders.length === 0) {
      setSelectedOrderId(null);
      return;
    }
    if (!selectedOrderId || !orders.some((order) => order.id === selectedOrderId)) {
      setSelectedOrderId(orders[0].id);
    }
  }, [orders, selectedOrderId]);

  async function reprintKitchenTicket() {
    if (!selectedOrder) return;
    setPrintingKitchen(true);
    try {
      const res = await fetch(`/api/admin/orders/${selectedOrder.id}/print`, {
        method: "POST",
      });
      if (!res.ok) {
        alert("Bon kon niet in de wachtrij gezet worden.");
      } else {
        window.dispatchEvent(new Event(TRIGGER_PRINT_EVENT));
      }
    } finally {
      setPrintingKitchen(false);
    }
  }

  async function reprintVatTicket() {
    if (!selectedOrder) return;
    setPrintingVat(true);
    try {
      const res = await fetch(`/api/admin/orders/${selectedOrder.id}/print-vat`, {
        method: "POST",
      });
      if (!res.ok) {
        alert("BTW-bon kon niet in de wachtrij gezet worden.");
      } else {
        window.dispatchEvent(new Event(TRIGGER_PRINT_EVENT));
      }
    } finally {
      setPrintingVat(false);
    }
  }

  return (
    <div className="admin-orders-page flex h-full overflow-hidden flex-col">
      <AdminPageHeader
        title="Bestellingen"
        description="Compact overzicht links, details rechts"
        action={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <div
              className="flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs text-stone-600"
              aria-live="polite"
            >
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              <span>
                {syncing ? "Bijwerken…" : "Live"}
                {" · "}
                {lastSync.toLocaleTimeString("nl-BE", {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}
              </span>
            </div>
          </div>
        }
      />

      <div className="mb-2 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-lg border border-stone-200 bg-white px-3 py-1.5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">
            Openstaand
          </p>
          <p className="text-base font-bold text-stone-900">{openCount}</p>
        </div>
        <div className="rounded-lg border border-stone-200 bg-white px-3 py-1.5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">
            Omzet vandaag
          </p>
          <p className="text-base font-bold text-stone-900">{formatCents(todayRevenueCents)}</p>
        </div>
        <div className="rounded-lg border border-stone-200 bg-white px-3 py-1.5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">
            Totaal orders
          </p>
          <p className="text-base font-bold text-stone-900">{orders.length}</p>
        </div>
        <div className="rounded-lg border border-stone-200 bg-white px-3 py-1.5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">
            Gesloten
          </p>
          <p className="text-base font-bold text-stone-900">{Math.max(0, orders.length - openCount)}</p>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 gap-2 lg:grid-cols-[26rem_1fr] 2xl:grid-cols-[30rem_1fr]">
        <section className="flex min-h-0 flex-col rounded-xl border border-stone-200 bg-white shadow-sm">
          <header className="flex items-center justify-between border-b border-stone-100 px-3 py-1.5">
            <p className="text-xs font-bold uppercase tracking-wide text-stone-500">
              Bestellingen
            </p>
            <p className="text-xs text-stone-500">{orders.length} totaal</p>
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto p-1.5">
            {orders.length === 0 ? (
              <p className="py-8 text-center text-sm text-stone-500">Nog geen bestellingen.</p>
            ) : (
              <div className="space-y-1.5">
                {orders.map((order) => {
                  const active = selectedOrder?.id === order.id;
                  const display = {
                    status: order.status,
                    paymentStatus: order.paymentStatus,
                  };
                  return (
                    <button
                      key={order.id}
                      type="button"
                      onClick={() => setSelectedOrderId(order.id)}
                      className={`w-full rounded-lg border px-2.5 py-1.5 text-left transition ${
                        active
                          ? "border-orange-300 bg-orange-50"
                          : "border-stone-200 bg-white hover:border-stone-300"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-mono text-xs font-bold text-stone-900">
                          {order.orderNumber}
                        </p>
                        <p className="text-xs font-semibold text-stone-700">
                          {formatCents(order.totalCents)}
                        </p>
                      </div>
                      <p className="mt-0.5 text-xs font-semibold text-stone-700">
                        {order.timeSlotLabel ? `Afhaaltijd: ${order.timeSlotLabel}` : "Afhaaltijd: z.s.m."}
                      </p>
                      <p className="mt-0.5 text-[11px] text-stone-500">
                        Besteld: {formatOrderTime(order.createdAt)}
                      </p>
                      <p className="mt-0.5 text-sm font-medium text-stone-900">{order.customerName}</p>
                      <div className="mt-0.5 flex items-center justify-between gap-2">
                        <p className="text-xs text-stone-600">
                          {order.fulfillment === "PICKUP" ? "Afhalen" : "Leveren"}
                        </p>
                        <StatusBadge
                          status={adminOrderBadgeKey(display)}
                          label={adminOrderStatusLabel(display)}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        <section className="flex min-h-0 flex-col rounded-xl border border-stone-200 bg-white shadow-sm">
          {!selectedOrder ? (
            <div className="flex min-h-0 flex-1 items-center justify-center p-6">
              <p className="text-sm text-stone-500">Selecteer links een bestelling.</p>
            </div>
          ) : (
            <>
              <header className="flex flex-wrap items-start justify-between gap-2 border-b border-stone-100 px-3 py-2">
                <div>
                  <p className="font-mono text-sm font-bold text-stone-900">
                    {selectedOrder.orderNumber}
                  </p>
                  <p className="text-xs text-stone-500">{formatOrderTime(selectedOrder.createdAt)}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={printingKitchen || printingVat}
                    onClick={() => void reprintKitchenTicket()}
                    className="rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50"
                  >
                    {printingKitchen ? "Printen…" : "Keukenbon"}
                  </button>
                  <button
                    type="button"
                    disabled={printingKitchen || printingVat}
                    onClick={() => void reprintVatTicket()}
                    className="rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50"
                  >
                    {printingVat ? "Printen…" : "BTW-bon"}
                  </button>
                  <StatusBadge
                    status={adminOrderBadgeKey({
                      status: selectedOrder.status,
                      paymentStatus: selectedOrder.paymentStatus,
                    })}
                    label={adminOrderStatusLabel({
                      status: selectedOrder.status,
                      paymentStatus: selectedOrder.paymentStatus,
                    })}
                  />
                  <OrderStatusActions
                    orderId={selectedOrder.id}
                    currentStatus={selectedOrder.status}
                    onUpdated={fetchOrders}
                  />
                </div>
              </header>

              <div className="min-h-0 flex-1 overflow-y-auto px-3 py-2">
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="rounded-lg border border-stone-200 bg-stone-50 p-2.5">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">
                      Klant
                    </p>
                    <p className="mt-1 font-medium text-stone-900">{selectedOrder.customerName}</p>
                    <p className="text-sm text-stone-700">{selectedOrder.customerPhone}</p>
                    {selectedOrder.customerEmail && (
                      <p className="text-xs text-stone-500">{selectedOrder.customerEmail}</p>
                    )}
                  </div>
                  <div className="rounded-lg border border-stone-200 bg-stone-50 p-2.5">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">
                      Levering
                    </p>
                    <p className="mt-1 font-medium text-stone-900">
                      {selectedOrder.fulfillment === "PICKUP" ? "Afhalen" : "Leveren"}
                    </p>
                    {selectedOrder.timeSlotLabel && (
                      <p className="text-sm text-stone-700">Tijdslot: {selectedOrder.timeSlotLabel}</p>
                    )}
                    {selectedOrder.fulfillment === "DELIVERY" && selectedOrder.customerAddress && (
                      <p className="text-xs text-stone-600">{selectedOrder.customerAddress}</p>
                    )}
                  </div>
                </div>

                <div className="mt-2 rounded-lg border border-stone-200">
                  <div className="border-b border-stone-100 px-3 py-1.5">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">
                      Bestelling
                    </p>
                  </div>
                  <ul className="space-y-1.5 p-2.5">
                    {selectedOrder.lines.map((line) => (
                      <li key={line.id} className="rounded-lg border border-stone-100 bg-stone-50/80 px-2.5 py-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-medium text-stone-900">
                            <span className="text-orange-600">{line.quantity}x</span> {line.name}
                          </p>
                          <p className="shrink-0 font-semibold text-stone-800">
                            {formatCents(line.lineTotalCents)}
                          </p>
                        </div>
                        {line.modifiers.length > 0 && (
                          <ul className="mt-1.5 space-y-0.5 border-t border-stone-200/80 pt-1.5">
                            {line.modifiers.map((mod, i) => (
                              <li key={i} className="text-xs text-stone-600">
                                + {mod.name}
                                {mod.priceCents > 0 && (
                                  <span className="text-stone-400"> ({formatCents(mod.priceCents)})</span>
                                )}
                              </li>
                            ))}
                          </ul>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>

                {selectedOrder.notes && (
                  <p className="mt-2 rounded-lg bg-amber-50 px-3 py-1.5 text-sm text-amber-900">
                    <span className="font-semibold">Opmerking:</span> {selectedOrder.notes}
                  </p>
                )}
              </div>

              <footer className="border-t border-stone-100 px-3 py-2">
                <p className="text-right text-xl font-bold text-stone-900">
                  Totaal {formatCents(selectedOrder.totalCents)}
                </p>
              </footer>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
