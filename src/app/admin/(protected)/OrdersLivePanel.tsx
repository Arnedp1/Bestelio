"use client";

import { useCallback, useEffect, useState } from "react";
import type { AdminOrdersSnapshot } from "@/lib/admin/orders";
import { formatCents } from "@/lib/utils/money";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminCard } from "@/components/admin/AdminCard";
import { AdminStat } from "@/components/admin/AdminStat";
import { OrderCard } from "./OrderCard";

const POLL_MS = 5_000;

export function OrdersLivePanel({
  initial,
}: {
  initial: AdminOrdersSnapshot;
}) {
  const [snapshot, setSnapshot] = useState(initial);
  const [lastSync, setLastSync] = useState(() => new Date());
  const [syncing, setSyncing] = useState(false);
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

  return (
    <div>
      <AdminPageHeader
        title="Bestellingen"
        description="Nieuwe orders verschijnen automatisch — met volledige inhoud"
        action={
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
        }
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-2">
        <AdminStat label="Openstaand" value={openCount} hint="Nog niet afgerond" accent />
        <AdminStat label="Omzet vandaag" value={formatCents(todayRevenueCents)} />
      </div>

      <AdminCard
        title="Recente bestellingen"
        description={`${orders.length} orders · ververst elke ${POLL_MS / 1000}s`}
      >
        {orders.length === 0 ? (
          <p className="py-8 text-center text-sm text-stone-500">Nog geen bestellingen.</p>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <OrderCard key={order.id} order={order} onUpdated={fetchOrders} />
            ))}
          </div>
        )}
      </AdminCard>
    </div>
  );
}
