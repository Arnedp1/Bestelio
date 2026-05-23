import Link from "next/link";
import type { Category, Product } from "@prisma/client";
import { AdminCard } from "@/components/admin/AdminCard";
import { SortableProductTable } from "./SortableProductTable";

type CategoryWithProducts = Category & { products: Product[] };

export function ProductsByCategory({
  categories,
  uncategorized,
  highlightCategoryId,
}: {
  categories: CategoryWithProducts[];
  uncategorized: Product[];
  highlightCategoryId?: string;
}) {
  return (
    <div className="space-y-6">
      {categories.map((cat) => (
        <AdminCard
          key={cat.id}
          id={`category-${cat.id}`}
          title={cat.name}
          description={
            [
              `${cat.products.length} product${cat.products.length === 1 ? "" : "en"}`,
              !cat.isActive ? "Niet zichtbaar in menu" : null,
              cat.description,
            ]
              .filter(Boolean)
              .join(" · ") || undefined
          }
          action={
            <Link
              href={`/admin/products?new=1&categoryId=${cat.id}`}
              scroll={false}
              className="text-sm font-semibold text-orange-600 hover:underline"
            >
              + Product in {cat.name}
            </Link>
          }
          className={`overflow-hidden ${
            highlightCategoryId === cat.id
              ? "ring-2 ring-orange-300 ring-offset-2"
              : ""
          }`}
        >
          <SortableProductTable products={cat.products} categoryId={cat.id} />
        </AdminCard>
      ))}

      {uncategorized.length > 0 && (
        <AdminCard
          title="Zonder categorie"
          description={`${uncategorized.length} product${uncategorized.length === 1 ? "" : "en"}`}
          className="overflow-hidden"
        >
          <SortableProductTable products={uncategorized} categoryId={null} />
        </AdminCard>
      )}
    </div>
  );
}
