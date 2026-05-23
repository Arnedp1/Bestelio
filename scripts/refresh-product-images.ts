/**
 * Leegt imageUrl voor alle producten (placeholder in de shop).
 * Run: npx tsx scripts/refresh-product-images.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const result = await prisma.product.updateMany({
    data: { imageUrl: null },
  });
  console.log(`Productafbeeldingen geleegd: ${result.count} producten`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
