"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { formatCents } from "@/lib/utils/money";
import { textWithoutLeadingEmoji } from "@/lib/storefront/product-emoji";
import type { StorefrontModifierGroup } from "@/lib/storefront/modifiers";
import type { Cart } from "@/lib/cart/types";
import { cartQuantityForProduct } from "@/lib/cart/types";
import { ProductImage } from "./ProductImage";
import { ProductCardActions } from "./ProductCardActions";
import { ProductDetailOverlay } from "./ProductDetailOverlay";

type Props = {
  productId: string;
  name: string;
  description: string | null;
  priceCents: number;
  imageUrl?: string | null;
  modifierGroups: StorefrontModifierGroup[];
  cartQuantity?: number;
  compact?: boolean;
};

export function ProductCard({
  productId,
  name,
  description,
  priceCents,
  imageUrl,
  modifierGroups,
  cartQuantity: initialCartQuantity = 0,
  compact = false,
}: Props) {
  const router = useRouter();
  const [detailOpen, setDetailOpen] = useState(false);
  const [cartQuantity, setCartQuantity] = useState(initialCartQuantity);
  const displayCartQuantity =
    cartQuantity < initialCartQuantity ? initialCartQuantity : cartQuantity;
  const text = textWithoutLeadingEmoji(description);

  const refreshCartQuantity = useCallback(async () => {
    const res = await fetch("/api/cart", { cache: "no-store" });
    if (!res.ok) return;
    const cart = (await res.json()) as Cart;
    setCartQuantity(cartQuantityForProduct(cart, productId));
  }, [productId]);

  const openDetail = () => setDetailOpen(true);

  return (
    <>
      {compact ? (
        <article className="card card-product p-2.5">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              className="min-w-0 flex-1 cursor-pointer text-left"
              onClick={openDetail}
            >
              <h3 className="line-clamp-1 text-sm font-semibold leading-tight text-stone-900">{name}</h3>
              {text && <p className="mt-0.5 line-clamp-1 text-xs text-stone-500">{text}</p>}
              <p className="mt-1 text-sm font-bold text-[var(--brand)]">{formatCents(priceCents)}</p>
            </button>
            <ProductCardActions
              productId={productId}
              productName={name}
              modifierGroups={modifierGroups}
              cartQuantity={displayCartQuantity}
              onOpenDetail={openDetail}
              onCartChange={() => {
                void refreshCartQuantity();
                router.refresh();
              }}
            />
          </div>
        </article>
      ) : (
        <article className="card card-product flex h-full flex-col overflow-hidden p-0">
          <button
            type="button"
            className="block w-full cursor-pointer text-left"
            onClick={openDetail}
            aria-label={`${name} bekijken`}
          >
            <ProductImage src={imageUrl} alt={name} size="card" className="rounded-none" />
          </button>

          <div className="flex min-h-0 flex-1 flex-col p-3">
            <button
              type="button"
              className="block min-w-0 flex-1 cursor-pointer text-left"
              onClick={openDetail}
            >
              <h3 className="text-sm font-semibold leading-snug text-stone-900">{name}</h3>
              {text && (
                <p className="mt-0.5 line-clamp-2 text-xs text-stone-500">{text}</p>
              )}
              <p className="mt-1.5 text-base font-bold text-[var(--brand)]">
                {formatCents(priceCents)}
              </p>
            </button>

            <div className="mt-2 flex shrink-0 items-center justify-end border-t border-stone-100 pt-2">
              <ProductCardActions
                productId={productId}
                productName={name}
                modifierGroups={modifierGroups}
                cartQuantity={displayCartQuantity}
                onOpenDetail={openDetail}
                onCartChange={() => {
                  void refreshCartQuantity();
                  router.refresh();
                }}
              />
            </div>
          </div>
        </article>
      )}

      <ProductDetailOverlay
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        product={{
          productId,
          name,
          description,
          priceCents,
          imageUrl,
          modifierGroups,
        }}
        onAdded={() => {
          void refreshCartQuantity();
          router.refresh();
        }}
      />
    </>
  );
}
