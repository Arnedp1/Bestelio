import { prisma } from "@/lib/prisma";
import { getCart } from "@/lib/cart/cookie";
import { resolveCartForTenant } from "@/lib/cart/resolve";
import { CartStaleSync } from "@/components/storefront/CartStaleSync";
import { cartQuantityForProduct } from "@/lib/cart/types";
import { requireTenant } from "@/lib/tenant/context";
import { StorefrontShell } from "@/components/storefront/StorefrontShell";
import { Hero } from "@/components/storefront/Hero";
import { CategoryNav } from "@/components/storefront/CategoryNav";
import { ProductCard } from "@/components/storefront/ProductCard";
import { DEFAULT_TAGLINE } from "@/lib/storefront/constants";
import { categoryEmoji } from "@/lib/storefront/category-emoji";
import { categoryModifiersInclude } from "@/lib/storefront/category-modifiers";
import { serializeModifierGroups } from "@/lib/storefront/serialize-modifiers";

export default async function HomePage() {
  const tenant = await requireTenant();
  const rawCart = await getCart();
  const { cart, hadStaleLines } = await resolveCartForTenant(tenant.id, rawCart);

  const categories = await prisma.category.findMany({
    where: { tenantId: tenant.id, isActive: true },
    orderBy: { sortOrder: "asc" },
    include: {
      modifierGroups: categoryModifiersInclude,
      products: {
        where: { isAvailable: true },
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  const menuCategories = categories.filter((c) => c.products.length > 0);

  const navCats = menuCategories.map((c) => ({
    slug: c.slug,
    name: c.name,
    emoji: categoryEmoji(c.slug),
  }));

  const totalProducts = menuCategories.reduce((n, c) => n + c.products.length, 0);

  return (
    <StorefrontShell>
      {hadStaleLines && <CartStaleSync />}
      <Hero title="Wat mag het zijn?" subtitle={DEFAULT_TAGLINE} />

      <div className="mt-6">
        <CategoryNav categories={navCats} />
      </div>

      <p className="mt-6 text-sm text-stone-500">
        {totalProducts} items · Vers bereid
      </p>

      <div id="menu" className="mt-8 scroll-mt-24 space-y-10">
        {menuCategories.map((cat) => (
          <section key={cat.id} id={cat.slug} className="scroll-mt-24">
            <div className="mb-4 flex items-end justify-between gap-2">
              <div>
                <h2 className="flex items-center gap-2 text-xl font-bold text-stone-900">
                  <span className="text-2xl">{categoryEmoji(cat.slug)}</span>
                  {cat.name}
                </h2>
                {cat.description && (
                  <p className="mt-0.5 text-sm text-stone-500">{cat.description}</p>
                )}
              </div>
              <span className="text-xs font-medium text-stone-400">
                {cat.products.length} items
              </span>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {cat.products.map((p) => (
                <ProductCard
                  key={p.id}
                  productId={p.id}
                  name={p.name}
                  description={p.description}
                  priceCents={p.priceCents}
                  imageUrl={p.imageUrl}
                  modifierGroups={serializeModifierGroups(cat.modifierGroups)}
                  cartQuantity={cartQuantityForProduct(cart, p.id)}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </StorefrontShell>
  );
}
