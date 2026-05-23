"use server";

import { getCart, setCart } from "@/lib/cart/cookie";
import { resolveCartForTenant } from "@/lib/cart/resolve";
import { requireTenant } from "@/lib/tenant/context";

/** Persists a sanitized cart after re-seed or removed products. */
export async function syncCartCookie(): Promise<{ hadStaleLines: boolean }> {
  const tenant = await requireTenant();
  const rawCart = await getCart();
  const { cart, hadStaleLines } = await resolveCartForTenant(tenant.id, rawCart);

  if (hadStaleLines) {
    await setCart(cart);
  }

  return { hadStaleLines };
}
