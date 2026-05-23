import type { Category, Product } from "@prisma/client";
import { btnPrimary, FormField, inputClass } from "@/components/admin/FormField";
import { upsertProduct } from "../actions";

export function ProductForm({
  categories,
  product,
  defaultCategoryId,
}: {
  categories: Category[];
  product?: Product;
  defaultCategoryId?: string;
}) {
  return (
    <form action={upsertProduct} className="space-y-4">
      {product && <input type="hidden" name="id" value={product.id} />}
      <FormField label="Naam">
        <input name="name" required defaultValue={product?.name} className={inputClass} />
      </FormField>
      <FormField label="Afbeelding URL (optioneel)">
        <input
          name="imageUrl"
          type="url"
          defaultValue={product?.imageUrl ?? ""}
          placeholder="https://… of upload via hosting"
          className={inputClass}
        />
      </FormField>
      <FormField label="Beschrijving">
        <textarea
          name="description"
          defaultValue={product?.description ?? ""}
          rows={3}
          className={inputClass}
        />
      </FormField>
      <FormField label="Categorie">
        <select
          name="categoryId"
          defaultValue={product?.categoryId ?? defaultCategoryId ?? ""}
          className={inputClass}
        >
          <option value="">— Geen —</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </FormField>
      <FormField label="Prijs (€)">
        <input
          name="priceEuro"
          type="number"
          step="0.01"
          min={0}
          required
          defaultValue={product ? (product.priceCents / 100).toFixed(2) : "0"}
          className={inputClass}
        />
      </FormField>
      <button type="submit" className={btnPrimary}>
        {product ? "Opslaan" : "Aanmaken"}
      </button>
    </form>
  );
}
