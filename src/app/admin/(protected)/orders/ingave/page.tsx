import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { getCart } from "@/lib/cart/cookie";
import { resolveCartForTenant } from "@/lib/cart/resolve";
import { requireTenant } from "@/lib/tenant/context";
import { categoryModifiersInclude } from "@/lib/storefront/category-modifiers";
import { serializeModifierGroups } from "@/lib/storefront/serialize-modifiers";
import { CartStaleSync } from "@/components/storefront/CartStaleSync";
import { AdminOrderEntryKiosk } from "./AdminOrderEntryKiosk";

export const dynamic = "force-dynamic";

export default async function AdminOrdersEntryPage() {
  const tenant = await requireTenant();
  const rawCart = await getCart();
  const { cart, hadStaleLines } = await resolveCartForTenant(tenant.id, rawCart);

  const [settings, categories] = await Promise.all([
    prisma.businessSettings.findUnique({ where: { tenantId: tenant.id } }),
    prisma.category.findMany({
      where: { tenantId: tenant.id, isActive: true },
      orderBy: { sortOrder: "asc" },
      include: {
        modifierGroups: categoryModifiersInclude,
        products: {
          where: { isAvailable: true },
          orderBy: { sortOrder: "asc" },
        },
      },
    }),
  ]);

  const menuCategories = categories
    .filter((c) => c.products.length > 0)
    .map((cat) => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      products: cat.products.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        priceCents: p.priceCents,
        imageUrl: p.imageUrl,
        modifierGroups: serializeModifierGroups(cat.modifierGroups),
      })),
    }));

  return (
    <>
      {hadStaleLines && <CartStaleSync />}

      <Suspense
        fallback={
          <p className="py-8 text-center text-sm text-stone-500">Kassa laden…</p>
        }
      >
        <AdminOrderEntryKiosk
          categories={menuCategories}
          initialCart={cart}
          pickupEnabled={settings?.pickupEnabled ?? true}
          deliveryEnabled={settings?.deliveryEnabled ?? false}
          minOrderCents={settings?.minOrderCents ?? 0}
        />
      </Suspense>
    </>
  );
}
