import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin/session";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminOverlay } from "@/components/admin/AdminOverlay";
import { btnPrimary } from "@/components/admin/FormField";
import { ProductsByCategory } from "./ProductsByCategory";
import { ScrollToCategorySection } from "./ScrollToCategorySection";
import { ProductEditPanel } from "./ProductEditPanel";
export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string; new?: string; categoryId?: string }>;
}) {
  const { tenantId } = await requireAdmin();
  const { edit, new: isNew, categoryId } = await searchParams;
  const showOverlay = Boolean(edit || isNew === "1");

  const [categories, uncategorized, allCategories, overlayProduct] = await Promise.all([
    prisma.category.findMany({
      where: { tenantId },
      orderBy: { sortOrder: "asc" },
      include: {
        products: {
          where: { tenantId },
          orderBy: { sortOrder: "asc" },
        },
      },
    }),
    prisma.product.findMany({
      where: { tenantId, categoryId: null },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.category.findMany({
      where: { tenantId },
      orderBy: { sortOrder: "asc" },
    }),
    edit
      ? prisma.product.findFirst({
          where: { id: edit, tenantId },
        })
      : Promise.resolve(null),
  ]);

  if (edit && !overlayProduct) {
    notFound();
  }

  const products = [...categories.flatMap((c) => c.products), ...uncategorized];
  const available = products.filter((p) => p.isAvailable).length;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Producten"
        description={`${products.length} artikelen in ${categories.length} categorieën · ${available} bestelbaar`}
        action={
          <Link href="/admin/products?new=1" className={btnPrimary} scroll={false}>
            + Nieuw product
          </Link>
        }
      />

      {categories.length === 0 ? (
        <p className="rounded-xl border border-dashed border-stone-300 bg-stone-50 px-4 py-8 text-center text-sm text-stone-600">
          Maak eerst een categorie aan onder{" "}
          <Link href="/admin/categories" className="font-medium text-orange-600 hover:underline">
            Categorieën
          </Link>
          , daarna kun je producten toevoegen.
        </p>
      ) : (
        <>
          <ScrollToCategorySection categoryId={categoryId} />
          <ProductsByCategory
            categories={categories}
            uncategorized={uncategorized}
            highlightCategoryId={categoryId}
          />
        </>
      )}

      {showOverlay && (
        <AdminOverlay
          title={overlayProduct?.name ?? "Nieuw product"}
          description={
            overlayProduct
              ? "Bewerk productgegevens"
              : "Voeg een artikel toe aan je menu"
          }
          closeHref="/admin/products"
        >
          <ProductEditPanel
            product={overlayProduct}
            categories={allCategories}
            defaultCategoryId={categoryId}
          />
        </AdminOverlay>
      )}
    </div>
  );
}
