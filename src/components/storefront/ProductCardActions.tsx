"use client";

import { useState } from "react";
import type { StorefrontModifierGroup } from "@/lib/storefront/modifiers";
import {
  defaultModifierSelection,
  hasSelectableOptions,
} from "@/lib/storefront/modifiers";

export function ProductCardActions({
  productId,
  productName,
  modifierGroups,
  cartQuantity = 0,
  onOpenDetail,
  onCartChange,
}: {
  productId: string;
  productName: string;
  modifierGroups: StorefrontModifierGroup[];
  cartQuantity?: number;
  onOpenDetail: () => void;
  onCartChange: () => void;
}) {
  const needsOptions = hasSelectableOptions(modifierGroups);
  const autoModifiers = defaultModifierSelection(modifierGroups);
  const [loading, setLoading] = useState(false);

  async function addToCart(qty: number, modifierOptionIds: string[] = []) {
    setLoading(true);
    const res = await fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId,
        quantity: qty,
        modifierOptionIds,
      }),
    });
    setLoading(false);

    if (!res.ok) return;
    onCartChange();
  }

  function handleAddClick(e: React.MouseEvent) {
    e.stopPropagation();
    if (needsOptions) {
      onOpenDetail();
      return;
    }
    void addToCart(1, autoModifiers);
  }

  const label =
    cartQuantity > 0
      ? `${cartQuantity} in mandje, nog een toevoegen`
      : needsOptions
        ? `${productName}, kies extra's`
        : `${productName} toevoegen`;

  return (
    <div className="flex items-center justify-end" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        disabled={loading}
        onClick={handleAddClick}
        className="product-add-btn"
        aria-label={label}
      >
        {loading ? (
          <span className="text-sm leading-none">…</span>
        ) : cartQuantity > 0 ? (
          <span className="leading-none">{cartQuantity}</span>
        ) : (
          <svg
            className="product-add-btn-icon"
            viewBox="0 0 14 14"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            aria-hidden
          >
            <path d="M7 2.5v9M2.5 7h9" />
          </svg>
        )}
      </button>
    </div>
  );
}
