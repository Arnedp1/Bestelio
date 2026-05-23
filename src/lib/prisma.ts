import { PrismaClient } from "@prisma/client";

/** Bump after schema/client changes so dev HMR does not keep a stale Prisma singleton. */
const PRISMA_DEV_CACHE_KEY = 2;

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  prismaDevCacheKey?: number;
};

if (
  process.env.NODE_ENV !== "production" &&
  globalForPrisma.prismaDevCacheKey !== PRISMA_DEV_CACHE_KEY
) {
  void globalForPrisma.prisma?.$disconnect();
  globalForPrisma.prisma = undefined;
  globalForPrisma.prismaDevCacheKey = PRISMA_DEV_CACHE_KEY;
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
