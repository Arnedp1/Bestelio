"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { formatCents } from "@/lib/utils/money";
import { textWithoutLeadingEmoji } from "@/lib/storefront/product-emoji";
import type { StorefrontModifierGroup } from "@/lib/storefront/modifiers";
import {
  defaultModifierSelection,
  groupsRequiringChoice,
  hasSelectableOptions,
  validateCategoryModifierSelection,
} from "@/lib/storefront/modifiers";
import { ProductImage } from "./ProductImage";
import { ModifierPicker } from "./ModifierPicker";
import { QuantityStepper } from "./QuantityStepper";

export type ProductDetailPayload = {
  productId: string;
  name: string;
  description: string | null;
  priceCents: number;
  imageUrl?: string | null;
  modifierGroups: StorefrontModifierGroup[];
};

export function ProductDetailOverlay({
  open,
  onClose,
  product,
  onAdded,
}: {
  open: boolean;
  onClose: () => void;
  product: ProductDetailPayload | null;
  onAdded?: () => void;
}) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const modifierGroups = product?.modifierGroups ?? [];
  const choiceGroups = groupsRequiringChoice(modifierGroups);
  const needsChoice = hasSelectableOptions(modifierGroups);
  const autoModifiers = defaultModifierSelection(modifierGroups);
  const description = textWithoutLeadingEmoji(product?.description ?? null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (open && product) {
      setQuantity(1);
      setSelected([]);
      setError(null);
    }
  }, [open, product?.productId]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  async function addToCart() {
    if (!product) return;

    if (needsChoice) {
      const allSelected = [...autoModifiers, ...selected];
      const modError = validateCategoryModifierSelection(modifierGroups, allSelected);
      if (modError) {
        setError(modError);
        return;
      }
    }

    setLoading(true);
    setError(null);
    const res = await fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId: product.productId,
        quantity,
        modifierOptionIds: needsChoice ? [...autoModifiers, ...selected] : autoModifiers,
      }),
    });
    setLoading(false);

    if (!res.ok) {
      setError("Kon niet toevoegen. Probeer opnieuw.");
      return;
    }

    router.refresh();
    onAdded?.();
    onClose();
  }

  if (!mounted || !open || !product) return null;

  return createPortal(
    <div
      className="storefront-popup"
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-detail-title"
    >
      <button
        type="button"
        className="storefront-popup-backdrop"
        aria-label="Sluiten"
        onClick={onClose}
      />
      <div className="storefront-popup-panel">
        <header className="storefront-popup-header">
          <div className="min-w-0 pr-3">
            <h2 id="product-detail-title" className="text-base font-bold text-stone-900">
              {product.name}
            </h2>
            <p className="mt-0.5 text-sm font-semibold text-[var(--brand)]">
              {formatCents(product.priceCents)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="storefront-popup-close"
            aria-label="Sluiten"
          >
            ✕
          </button>
        </header>

        <div className="storefront-popup-intro">
          <ProductImage
            src={product.imageUrl}
            alt={product.name}
            size="thumb"
            className="mx-auto"
          />

          {description && (
            <p className="mt-3 text-sm leading-relaxed text-stone-600">{description}</p>
          )}
        </div>

        {needsChoice && (
          <div className="storefront-popup-options">
            <ModifierPicker
              groups={choiceGroups}
              selected={selected}
              onChange={setSelected}
              compact
            />
          </div>
        )}

        <footer className="storefront-popup-footer">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-semibold text-stone-700">Aantal</p>
            <QuantityStepper value={quantity} onChange={setQuantity} size="sm" max={99} />
          </div>

          {error && (
            <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}

          <button
            type="button"
            disabled={loading}
            onClick={() => void addToCart()}
            className="btn-primary mt-3 w-full"
          >
            {loading ? "Bezig…" : `${quantity}× toevoegen aan mandje`}
          </button>
        </footer>
      </div>
    </div>,
    document.body
  );
}
