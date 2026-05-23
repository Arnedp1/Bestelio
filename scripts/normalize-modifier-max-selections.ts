/**
 * Eenmalig: zet oude maxSelections (2–98) om naar 99 (= admin «meerdere opties»).
 * Run: npx tsx scripts/normalize-modifier-max-selections.ts
 */
import { PrismaClient } from "@prisma/client";
import { MULTIPLE_MODIFIER_MAX } from "../src/lib/modifiers/selection";

const prisma = new PrismaClient();

async function main() {
  const updated = await prisma.categoryModifierGroup.updateMany({
    where: { maxSelections: { gt: 1, lt: MULTIPLE_MODIFIER_MAX } },
    data: { maxSelections: MULTIPLE_MODIFIER_MAX },
  });
  console.log(`Bijgewerkt: ${updated.count} optiegroep(en) → maxSelections ${MULTIPLE_MODIFIER_MAX}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
