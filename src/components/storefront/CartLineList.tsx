"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatCents } from "@/lib/utils/money";
import { emojiFromDescription } from "@/lib/storefront/product-emoji";
import type { CartLine } from "@/lib/cart/types";
import { QuantityStepper } from "./QuantityStepper";

export type CartLineView = CartLine & { lineKey: string };

export function CartLineList({
  lines,
  className = "",
}: {
  lines: CartLineView[];
  className?: string;
}) {
  const router = useRouter();
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function setQuantity(lineKey: string, quantity: number) {
    setPendingKey(lineKey);
    setError(null);

    const res = await fetch("/api/cart", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lineKey, quantity }),
    });

    setPendingKey(null);

    if (!res.ok) {
      setError("Kon de hoeveelheid niet aanpassen. Probeer opnieuw.");
      return;
    }

    router.refresh();
  }

  return (
    <div className={className}>
      {error && (
        <p className="mb-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}

      <ul className="card divide-y divide-stone-100 overflow-hidden">
        {lines.map((line) => {
          const modTotal = line.modifiers.reduce((s, m) => s + m.priceCents, 0);
          const unit = line.unitPriceCents + modTotal;
          const displayName = line.name.replace(/^(\p{Extended_Pictographic})\s*/u, "");
          const busy = pendingKey === line.lineKey;

          return (
            <li
              key={line.lineKey}
              className={`flex items-center gap-2.5 px-3 py-2.5 sm:gap-3 ${busy ? "opacity-70" : ""}`}
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-lg">
                {emojiFromDescription(line.name)}
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="truncate text-sm font-semibold text-stone-900">{displayName}</p>
                  <p className="shrink-0 text-sm font-bold text-stone-900">
                    {formatCents(unit * line.quantity)}
                  </p>
                </div>
                {line.modifiers.length > 0 && (
                  <p className="mt-0.5 truncate text-xs text-stone-500">
                    {line.modifiers.map((m) => m.name).join(" · ")}
                  </p>
                )}
                {line.quantity > 1 && (
                  <p className="text-[11px] text-stone-400">
                    {formatCents(unit)} per stuk
                  </p>
                )}
              </div>

              <QuantityStepper
                size="xs"
                min={0}
                max={99}
                value={line.quantity}
                disabled={busy}
                onChange={(qty) => void setQuantity(line.lineKey, qty)}
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
