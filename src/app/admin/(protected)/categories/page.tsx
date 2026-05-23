import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin/session";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminCard } from "@/components/admin/AdminCard";
import { AdminOverlay } from "@/components/admin/AdminOverlay";
import { btnPrimary } from "@/components/admin/FormField";
import { CategoryList, type AdminCategory } from "./CategoryList";
import { CategoryNewPanel } from "./CategoryNewPanel";

export default async function AdminCategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ open?: string; modifiers?: string; new?: string }>;
}) {
  const { tenantId } = await requireAdmin();
  const { open: initialOpenId, modifiers: initialModifiersId, new: isNew } = await searchParams;
  const showNewOverlay = isNew === "1";

  const categories = await prisma.category.findMany({
    where: { tenantId },
    orderBy: { sortOrder: "asc" },
    include: {
      _count: { select: { products: true } },
      modifierGroups: {
        orderBy: { sortOrder: "asc" },
        include: { options: { orderBy: { sortOrder: "asc" } } },
      },
    },
  });

  const list: AdminCategory[] = categories.map((cat) => ({
    id: cat.id,
    name: cat.name,
    description: cat.description,
    sortOrder: cat.sortOrder,
    isActive: cat.isActive,
    productCount: cat._count.products,
    modifierGroups: cat.modifierGroups.map((g) => ({
      id: g.id,
      name: g.name,
      maxSelections: g.maxSelections,
      isRequired: g.isRequired,
      options: g.options.map((o) => ({
        id: o.id,
        name: o.name,
        priceCents: o.priceCents,
      })),
    })),
  }));

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Categorieën"
        description="Sleep om te sorteren · extra opties per categorie · zichtbaarheid"
        action={
          <Link href="/admin/categories?new=1" className={btnPrimary} scroll={false}>
            + Nieuwe categorie
          </Link>
        }
      />

      <AdminCard title={`${categories.length} categorieën`}>
        <p className="mb-4 text-sm text-stone-600">
          Klik <strong>Beheren</strong> voor gegevens. <strong>Extra opties</strong> opent in een
          apart venster — geldt voor alle producten in die categorie.
        </p>
        <CategoryList
          categories={list}
          initialOpenId={initialOpenId}
          initialModifiersId={initialModifiersId}
        />
      </AdminCard>

      {showNewOverlay && (
        <AdminOverlay
          title="Nieuwe categorie"
          description="Voeg een menu-onderdeel toe"
          closeHref="/admin/categories"
        >
          <CategoryNewPanel />
        </AdminOverlay>
      )}
    </div>
  );
}
