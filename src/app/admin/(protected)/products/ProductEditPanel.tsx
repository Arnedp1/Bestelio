import Link from "next/link";
import type { Category, Product } from "@prisma/client";
import { AdminCard } from "@/components/admin/AdminCard";
import { btnPrimary } from "@/components/admin/FormField";
import { ProductForm } from "./ProductForm";

export function ProductEditPanel({
  product,
  categories,
  defaultCategoryId,
}: {
  product: Product | null;
  categories: Category[];
  defaultCategoryId?: string;
}) {
  const category = product?.categoryId
    ? categories.find((c) => c.id === product.categoryId)
    : null;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <AdminCard title="Gegevens">
        <ProductForm
          categories={categories}
          product={product ?? undefined}
          defaultCategoryId={defaultCategoryId}
        />
      </AdminCard>
      <AdminCard
        title="Extra opties"
        description="Sauzen, drankkeuze en andere extra's stel je in per categorie"
      >
        {product?.categoryId && category ? (
          <div className="space-y-3 text-sm text-stone-600">
            <p>
              Dit product hoort bij <strong className="text-stone-900">{category.name}</strong>.
              Extra opties gelden voor alle producten in die categorie.
            </p>
            <Link
              href={`/admin/categories?open=${product.categoryId}`}
              className={btnPrimary}
            >
              Opties beheren bij categorie
            </Link>
          </div>
        ) : product ? (
          <p>
            Kies eerst een categorie bij de gegevens. Zonder categorie zijn er geen extra opties
            op de bestelpagina.
          </p>
        ) : (
          <p>Sla het product op en kies een categorie om extra opties in te stellen.</p>
        )}
      </AdminCard>
    </div>
  );
}
