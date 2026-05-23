import { prisma } from "@/lib/prisma";

export async function getStorefrontBrand(tenantId: string) {
  const brand = await prisma.brandSettings.findUnique({ where: { tenantId } });
  return {
    displayName: brand?.displayName ?? "Bestellen",
    primaryColor: brand?.primaryColor ?? "#e85d04",
    logoUrl: brand?.logoUrl ?? null,
  };
}
