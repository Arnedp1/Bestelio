"use client";

import { formatCents } from "@/lib/utils/money";
import type { AdminOrderDto } from "@/lib/admin/orders";
import {
  adminOrderBadgeKey,
  adminOrderIsOpen,
  adminOrderStatusLabel,
} from "@/lib/admin/order-display";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { OrderStatusActions } from "./OrderStatusActions";

function formatOrderTime(iso: string) {
  return new Date(iso).toLocaleString("nl-BE", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function OrderCard({
  order,
  onUpdated,
}: {
  order: AdminOrderDto;
  onUpdated: () => void;
}) {
  const display = {
    status: order.status,
    paymentStatus: order.paymentStatus,
  };
  const isOpen = adminOrderIsOpen(display);

  return (
    <article
      className={`rounded-xl border bg-white p-4 shadow-sm ${
        isOpen ? "border-orange-200 bg-orange-50/40" : "border-stone-200"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-stone-100 pb-3">
        <div>
          <p className="font-mono text-sm font-bold text-stone-900">{order.orderNumber}</p>
          <p className="text-xs text-stone-500">{formatOrderTime(order.createdAt)}</p>
        </div>
        <StatusBadge
          status={adminOrderBadgeKey(display)}
          label={adminOrderStatusLabel(display)}
        />
      </div>

      <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">
            Klant
          </p>
          <p className="font-medium text-stone-900">{order.customerName}</p>
          <p className="text-stone-600">{order.customerPhone}</p>
          {order.customerEmail && (
            <p className="text-xs text-stone-500">{order.customerEmail}</p>
          )}
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">
            Afhalen / leveren
          </p>
          <p className="font-medium text-stone-900">
            {order.fulfillment === "PICKUP" ? "Afhalen" : "Leveren"}
          </p>
          {order.timeSlotLabel && (
            <p className="text-stone-600">Tijdslot: {order.timeSlotLabel}</p>
          )}
          {order.fulfillment === "DELIVERY" && order.customerAddress && (
            <p className="text-xs text-stone-600">{order.customerAddress}</p>
          )}
        </div>
      </div>

      <div className="mt-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">
          Bestelling
        </p>
        <ul className="mt-2 space-y-2">
          {order.lines.map((line) => (
            <li
              key={line.id}
              className="rounded-lg border border-stone-100 bg-stone-50/80 px-3 py-2"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium text-stone-900">
                  <span className="text-orange-600">{line.quantity}×</span> {line.name}
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
                        <span className="text-stone-400">
                          {" "}
                          ({formatCents(mod.priceCents)})
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </div>

      {order.notes && (
        <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
          <span className="font-semibold">Opmerking:</span> {order.notes}
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-stone-100 pt-3">
        <p className="text-base font-bold text-stone-900">
          Totaal {formatCents(order.totalCents)}
        </p>
        <OrderStatusActions
          orderId={order.id}
          currentStatus={order.status}
          onUpdated={onUpdated}
        />
      </div>
    </article>
  );
}
