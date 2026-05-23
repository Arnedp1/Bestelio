/** Prisma include for category-level modifier groups (shared by all products in the category). */
export const categoryModifiersInclude = {
  orderBy: { sortOrder: "asc" as const },
  include: {
    options: {
      where: { isActive: true },
      orderBy: { sortOrder: "asc" as const },
    },
  },
};
