import { PrismaClient } from "@prisma/client";
import { join } from "path";
import { loadCategoryModifierTemplates } from "./parse-category-modifiers";

const prisma = new PrismaClient();

export async function importCategoryModifiersForTenant(
  tenantId: string,
  csvPath?: string
): Promise<{ applied: number; skipped: string[] }> {
  const path = csvPath ?? join(__dirname, "data", "thefoodstop_menu_modifiers.csv");
  const templates = loadCategoryModifierTemplates(path);

  const categories = await prisma.category.findMany({
    where: { tenantId },
    select: { id: true, name: true, slug: true },
  });

  const bySlug = new Map(categories.map((c) => [c.slug, c]));
  const skipped: string[] = [];
  let applied = 0;

  for (const template of templates) {
    const category = bySlug.get(template.categorySlug);
    if (!category) {
      skipped.push(`${template.categoryName} (slug: ${template.categorySlug})`);
      continue;
    }

    await prisma.categoryModifierOption.deleteMany({
      where: { group: { categoryId: category.id } },
    });
    await prisma.categoryModifierGroup.deleteMany({
      where: { categoryId: category.id },
    });

    for (let g = 0; g < template.groups.length; g++) {
      const group = template.groups[g];
      const created = await prisma.categoryModifierGroup.create({
        data: {
          categoryId: category.id,
          name: group.name,
          minSelections: group.isRequired ? 1 : 0,
          maxSelections: group.maxSelections,
          isRequired: group.isRequired,
          sortOrder: g + 1,
        },
      });

      for (let o = 0; o < group.options.length; o++) {
        const opt = group.options[o];
        await prisma.categoryModifierOption.create({
          data: {
            groupId: created.id,
            name: opt.name,
            priceCents: opt.priceCents,
            isDefault: opt.isDefault,
            sortOrder: o + 1,
            isActive: true,
          },
        });
      }
    }

    applied++;
    console.log(
      `  ${category.name}: ${template.groups.length} groep(en), ${template.groups.reduce((n, g) => n + g.options.length, 0)} opties`
    );
  }

  return { applied, skipped };
}

export async function runCategoryModifierImportCli() {
  const tenantSlug = process.env.TENANT_SLUG ?? "demo-frituur";
  const csvArg = process.argv[2];

  const tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug } });
  if (!tenant) {
    console.error(`Tenant niet gevonden: ${tenantSlug}`);
    process.exit(1);
  }

  console.log(`Import optiegroepen voor ${tenant.name}…`);
  const { applied, skipped } = await importCategoryModifiersForTenant(tenant.id, csvArg);

  console.log(`Klaar: ${applied} categorie(ën) bijgewerkt.`);
  if (skipped.length > 0) {
    console.warn("Overgeslagen (categorie niet in DB):", skipped.join(", "));
  }
}
