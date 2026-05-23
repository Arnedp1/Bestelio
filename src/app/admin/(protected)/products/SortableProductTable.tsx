"use client";

import Link from "next/link";
import type { Product } from "@prisma/client";
import { ProductImage } from "@/components/storefront/ProductImage";
import { ConfirmDeleteForm } from "@/components/admin/ConfirmDeleteForm";
import { SortableTable } from "@/components/admin/SortableTable";
import { formatCents } from "@/lib/utils/money";
import { btnDanger } from "@/components/admin/FormField";
import { deleteProduct, reorderProducts } from "../actions";
import { ProductAvailableToggle } from "./ProductAvailableToggle";

const PRODUCT_TABLE_COLGROUP = (
  <colgroup>
    <col className="admin-products-col-handle" />
    <col className="admin-products-col-product" />
    <col className="admin-products-col-price" />
    <col className="admin-products-col-available" />
    <col className="admin-products-col-actions" />
  </colgroup>
);

export function SortableProductTable({
  products,
  categoryId,
}: {
  products: Product[];
  categoryId: string | null;
}) {
  return (
    <SortableTable
      items={products}
      onReorder={(ids) => reorderProducts(categoryId, ids)}
      emptyMessage="Nog geen producten in deze categorie."
      tableClassName="admin-products-table"
      colgroup={PRODUCT_TABLE_COLGROUP}
      columns={[
        { header: "Product", className: "admin-products-col-product" },
        { header: "Prijs", className: "admin-products-col-price" },
        { header: "Bestelbaar", className: "admin-products-col-available" },
        { header: "Acties", className: "admin-products-col-actions text-right" },
      ]}
      renderRow={(product) => {
        const editHref = `/admin/products?edit=${product.id}`;
        return (
          <>
            <td className="align-middle">
              <div className="flex items-center gap-3">
                <ProductImage
                  src={product.imageUrl}
                  alt={product.name}
                  size="mini"
                  className="rounded-lg"
                />
                <Link
                  href={editHref}
                  scroll={false}
                  className="truncate font-medium text-stone-900 hover:text-orange-600"
                >
                  {product.name}
                </Link>
              </div>
            </td>
            <td className="admin-products-col-price align-middle font-semibold tabular-nums whitespace-nowrap">
              {formatCents(product.priceCents)}
            </td>
            <td className="admin-products-col-available align-middle">
              <ProductAvailableToggle
                key={`${product.id}-${product.isAvailable}`}
                productId={product.id}
                available={product.isAvailable}
              />
            </td>
            <td className="admin-products-col-actions align-middle text-right whitespace-nowrap">
              <div className="flex items-center justify-end gap-2">
                <Link
                  href={editHref}
                  scroll={false}
                  className="text-xs font-medium text-orange-600 hover:underline"
                >
                  Bewerken
                </Link>
                <ConfirmDeleteForm
                  action={deleteProduct}
                  message={`Weet je zeker dat je "${product.name}" wilt verwijderen?`}
                >
                  <input type="hidden" name="id" value={product.id} />
                  <button type="submit" className={btnDanger}>
                    Verwijder
                  </button>
                </ConfirmDeleteForm>
              </div>
            </td>
          </>
        );
      }}
    />
  );
}
