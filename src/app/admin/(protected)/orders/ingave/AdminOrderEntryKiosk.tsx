"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { formatCents } from "@/lib/utils/money";
import { categoryEmoji } from "@/lib/storefront/category-emoji";
import {
  defaultModifierSelection,
  hasSelectableOptions,
} from "@/lib/storefront/modifiers";
import type { StorefrontModifierGroup } from "@/lib/storefront/modifiers";
import type { Cart } from "@/lib/cart/types";
import { cartQuantityForProduct, cartSubtotalCents } from "@/lib/cart/types";
import { ProductImage } from "@/components/storefront/ProductImage";
import {
  ProductDetailOverlay,
  type ProductDetailPayload,
} from "@/components/storefront/ProductDetailOverlay";
import { formatDateDisplayShort, isoDateFromDate } from "@/lib/dates/calendar";
import { fetchFirstAvailableSlots } from "@/lib/slots/fetch-first-available";

export type EntryProduct = {
  id: string;
  name: string;
  description: string | null;
  priceCents: number;
  imageUrl: string | null;
  modifierGroups: StorefrontModifierGroup[];
};

export type EntryCategory = {
  id: string;
  name: string;
  slug: string;
  products: EntryProduct[];
};

type Slot = { id: string; startsAt: string };

type Props = {
  categories: EntryCategory[];
  initialCart: Cart;
  pickupEnabled: boolean;
  deliveryEnabled: boolean;
  minOrderCents: number;
};

export function AdminOrderEntryKiosk({
  categories,
  initialCart,
  pickupEnabled,
  deliveryEnabled,
  minOrderCents,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const catParam = searchParams.get("cat");

  const [cart, setCart] = useState(initialCart);

  useEffect(() => {
    setCart(initialCart);
  }, [initialCart]);
  const [detailProduct, setDetailProduct] = useState<ProductDetailPayload | null>(null);
  const [fulfillment, setFulfillment] = useState<"PICKUP" | "DELIVERY">(
    pickupEnabled ? "PICKUP" : "DELIVERY"
  );
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotId, setSlotId] = useState("");
  const [slotDate, setSlotDate] = useState(() => isoDateFromDate(new Date()));
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [address, setAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedSlug = useMemo(() => {
    if (catParam && categories.some((c) => c.slug === catParam)) return catParam;
    return categories[0]?.slug ?? "";
  }, [catParam, categories]);

  const activeCategory = useMemo(
    () => categories.find((c) => c.slug === selectedSlug) ?? categories[0],
    [categories, selectedSlug]
  );

  const subtotal = cartSubtotalCents(cart);
  const lineCount = cart.lines.reduce((n, l) => n + l.quantity, 0);

  const refreshCart = useCallback(async () => {
    const res = await fetch("/api/cart", { cache: "no-store" });
    if (res.ok) setCart((await res.json()) as Cart);
  }, []);

  const selectCategory = (slug: string) => {
    router.replace(`/admin/orders/ingave?cat=${encodeURIComponent(slug)}`, { scroll: false });
  };

  const addProduct = useCallback(
    async (product: EntryProduct, modifierIds: string[] = []) => {
    const res = await fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId: product.id,
        quantity: 1,
        modifierOptionIds: modifierIds,
      }),
    });
    if (res.ok) await refreshCart();
  }, [refreshCart]);

  const onProductTap = (product: EntryProduct) => {
    if (hasSelectableOptions(product.modifierGroups)) {
      setDetailProduct({
        productId: product.id,
        name: product.name,
        description: product.description,
        priceCents: product.priceCents,
        imageUrl: product.imageUrl,
        modifierGroups: product.modifierGroups,
      });
      return;
    }
    void addProduct(product, defaultModifierSelection(product.modifierGroups));
  };

  useEffect(() => {
    let cancelled = false;
    void fetchFirstAvailableSlots(fulfillment).then(({ date, slots: list }) => {
      if (cancelled) return;
      setSlotDate(date);
      setSlots(list);
      setSlotId(list[0]?.id ?? "");
    });
    return () => {
      cancelled = true;
    };
  }, [fulfillment]);

  async function submitOrder() {
    if (!slotId) {
      setError("Kies een tijdslot.");
      return;
    }
    if (cart.lines.length === 0) {
      setError("Voeg minstens één product toe.");
      return;
    }
    if (minOrderCents > 0 && subtotal < minOrderCents) {
      setError(`Minimum: ${formatCents(minOrderCents)}`);
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/orders/entry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: customerName.trim() || undefined,
          customerPhone: customerPhone.trim() || undefined,
          fulfillment,
          customerAddress: fulfillment === "DELIVERY" ? address.trim() : undefined,
          timeSlotInstanceId: slotId,
        }),
      });
      const data = (await res.json()) as { ok?: boolean; message?: string };
      if (!res.ok) {
        setError(data.message ?? "Bestelling mislukt.");
        return;
      }
      router.push("/admin/orders");
      router.refresh();
    } catch {
      setError("Geen verbinding.");
    } finally {
      setSubmitting(false);
    }
  }

  function formatSlotTime(iso: string) {
    return new Date(iso).toLocaleTimeString("nl-BE", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <>
      <div className="admin-pos-kiosk flex h-full overflow-hidden flex-col">
        <div className="flex min-h-0 flex-1 flex-col gap-2 lg:flex-row">
          <section className="flex min-h-0 min-w-0 flex-1 flex-col rounded-xl border border-stone-200 bg-white shadow-sm">
            <div className="shrink-0 border-b border-stone-100 px-3 py-2">
              <h2 className="text-sm font-bold uppercase tracking-wide text-stone-500">
                {activeCategory?.name ?? "Producten"}
              </h2>
            </div>
            <div className="admin-pos-products flex min-h-0 flex-1 flex-wrap content-start items-start gap-3 overflow-x-hidden overflow-y-scroll p-3">
              {activeCategory?.products.map((p) => {
                const qty = cartQuantityForProduct(cart, p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => onProductTap(p)}
                    className="admin-pos-product-tile relative shrink-0 self-start"
                  >
                    <div className="relative aspect-[4/3] w-[7.5rem] overflow-hidden rounded-lg bg-stone-100 sm:w-[8.5rem]">
                      <ProductImage
                        src={p.imageUrl}
                        alt={p.name}
                        size="thumb"
                        className="!h-full !w-full rounded-lg"
                      />
                      <span className="absolute left-1 top-1 rounded bg-stone-900 px-1.5 py-0.5 text-xs font-bold text-white">
                        {formatCents(p.priceCents)}
                      </span>
                      {qty > 0 && (
                        <span className="absolute right-1 top-1 flex h-6 min-w-6 items-center justify-center rounded-full bg-[var(--brand)] px-1.5 text-xs font-bold text-white">
                          {qty}
                        </span>
                      )}
                    </div>
                    <p className="mt-1.5 line-clamp-2 w-[7.5rem] text-center text-xs font-semibold leading-tight text-stone-800 sm:w-[8.5rem]">
                      {p.name}
                    </p>
                  </button>
                );
              })}
            </div>
          </section>

          <aside className="flex min-h-0 w-full shrink-0 flex-col gap-2 overflow-hidden lg:sticky lg:top-0 lg:h-full lg:w-[19rem]">
            <div className="shrink-0 rounded-xl border border-stone-200 bg-white p-3 shadow-sm">
              <p className="mb-2 text-center text-xs font-bold uppercase tracking-wide text-stone-500">
                Soort bestelling
              </p>
              <div className="grid grid-cols-2 gap-2">
                {pickupEnabled && (
                  <button
                    type="button"
                    onClick={() => setFulfillment("PICKUP")}
                    className={`admin-pos-fulfillment-btn ${fulfillment === "PICKUP" ? "is-active" : ""}`}
                  >
                    <span className="text-2xl" aria-hidden>
                      🏪
                    </span>
                    <span>Afhalen</span>
                  </button>
                )}
                {deliveryEnabled && (
                  <button
                    type="button"
                    onClick={() => setFulfillment("DELIVERY")}
                    className={`admin-pos-fulfillment-btn ${fulfillment === "DELIVERY" ? "is-active" : ""}`}
                  >
                    <span className="text-2xl" aria-hidden>
                      🚗
                    </span>
                    <span>Leveren</span>
                  </button>
                )}
              </div>
            </div>

            <div className="flex min-h-0 flex-1 flex-col overflow-y-auto rounded-xl border border-stone-200 bg-white p-3 shadow-sm">
              <p className="mb-2 text-xs font-bold uppercase text-stone-500">
                Tijdslot
                {slotDate !== isoDateFromDate(new Date()) && (
                  <span className="ml-1 font-medium normal-case text-stone-600">
                    · {formatDateDisplayShort(slotDate)}
                  </span>
                )}
              </p>
              <div className="mb-3 flex flex-wrap gap-1.5">
                {slots.length === 0 && (
                  <p className="text-xs text-stone-500">Geen slots</p>
                )}
                {slots.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSlotId(s.id)}
                    className={`rounded-lg border px-3 py-2 text-sm font-semibold ${
                      slotId === s.id
                        ? "border-orange-600 bg-orange-600 text-white"
                        : "border-stone-200 bg-stone-50 text-stone-700"
                    }`}
                  >
                    {formatSlotTime(s.startsAt)}
                  </button>
                ))}
              </div>
              <div className="grid gap-2 text-sm">
                <input
                  className="input-field py-2 text-sm"
                  placeholder="Naam (optioneel)"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
                <input
                  className="input-field py-2 text-sm"
                  placeholder="Telefoon (optioneel)"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                />
                {fulfillment === "DELIVERY" && (
                  <input
                    className="input-field py-2 text-sm"
                    placeholder="Adres levering"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                )}
              </div>
            </div>

            <div className="shrink-0 rounded-xl border border-stone-200 bg-stone-900 p-3 text-white shadow-sm">
              <p className="text-xs text-stone-400">
                {lineCount} item(s) · {formatCents(subtotal)}
              </p>
              {error && <p className="mt-1 text-xs text-red-300">{error}</p>}
              <button
                type="button"
                disabled={submitting || cart.lines.length === 0}
                onClick={() => void submitOrder()}
                className="btn-primary mt-3 w-full !bg-[var(--brand)] py-3 text-base"
              >
                {submitting ? "Bezig…" : "Bestelling plaatsen"}
              </button>
            </div>
          </aside>
        </div>

        <nav className="admin-pos-categories shrink-0 rounded-xl border border-stone-200 bg-white p-2 shadow-sm">
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7">
            {categories.map((cat) => {
              const active = cat.slug === selectedSlug;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => selectCategory(cat.slug)}
                  className={`admin-pos-category-btn ${active ? "is-active" : ""}`}
                >
                  <span className="text-lg" aria-hidden>
                    {categoryEmoji(cat.slug)}
                  </span>
                  <span className="line-clamp-2 text-center text-xs font-bold leading-tight sm:text-sm">
                    {cat.name}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>
      </div>

      <ProductDetailOverlay
        open={detailProduct !== null}
        onClose={() => setDetailProduct(null)}
        product={detailProduct}
        touchFriendly
        onAdded={() => {
          void refreshCart();
        }}
      />
    </>
  );
}
