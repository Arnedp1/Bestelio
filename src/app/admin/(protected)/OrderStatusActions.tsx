"use client";

import { useRouter } from "next/navigation";
import type { OrderStatus } from "@prisma/client";
import { adminOrderIsOpen } from "@/lib/admin/order-display";
import { btnDanger } from "@/components/admin/FormField";

export function OrderStatusActions({
  orderId,
  currentStatus,
  onUpdated,
}: {
  orderId: string;
  currentStatus: OrderStatus;
  onUpdated?: () => void | Promise<void>;
}) {
  const router = useRouter();

  if (!adminOrderIsOpen({ status: currentStatus })) {
    return null;
  }

  async function updateStatus(status: OrderStatus) {
    const res = await fetch(`/api/admin/orders/${orderId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) return;
    if (onUpdated) await onUpdated();
    else router.refresh();
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => updateStatus("COMPLETED")}
        className="rounded-lg bg-stone-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-orange-600"
      >
        Afgerond
      </button>
      <button
        type="button"
        onClick={() => updateStatus("CANCELLED")}
        className={`${btnDanger} !px-3 !py-1.5 text-xs`}
      >
        Annuleren
      </button>
    </div>
  );
}
