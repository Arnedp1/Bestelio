import { PrismaClient } from "@prisma/client";
import { runCategoryModifierImportCli } from "../prisma/import-category-modifiers";

const prisma = new PrismaClient();

runCategoryModifierImportCli()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
