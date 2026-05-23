import { prisma } from "@/lib/prisma";
import { categoryModifiersInclude } from "@/lib/storefront/category-modifiers";
import type { Cart, CartLine } from "./types";

/** Drops stale lines (e.g. after re-seed) and refreshes names/prices from DB. */
export async function resolveCartForTenant(
  tenantId: string,
  cart: Cart
): Promise<{ cart: Cart; hadStaleLines: boolean }> {
  if (cart.lines.length === 0) {
    return { cart: { lines: [] }, hadStaleLines: false };
  }

  const productIds = [...new Set(cart.lines.map((l) => l.productId))];
  const products = await prisma.product.findMany({
    where: {
      tenantId,
      id: { in: productIds },
      isAvailable: true,
    },
    include: {
      category: { include: { modifierGroups: categoryModifiersInclude } },
    },
  });

  const byId = new Map(products.map((p) => [p.id, p]));
  const lines: CartLine[] = [];

  for (const line of cart.lines) {
    const product = byId.get(line.productId);
    if (!product) continue;

    const validOptionIds = new Set(
      (product.category?.modifierGroups ?? []).flatMap((g) =>
        g.options.map((o) => o.id)
      )
    );
    const modifiers = line.modifiers.filter((m) => validOptionIds.has(m.optionId));

    lines.push({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      unitPriceCents: product.priceCents,
      quantity: line.quantity,
      modifiers,
    });
  }

  return {
    cart: { lines },
    hadStaleLines: lines.length !== cart.lines.length,
  };
}
