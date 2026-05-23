import { FulfillmentType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/** Houd per afhalen/leveren maximaal één regel over (oudste id blijft). */
export async function consolidateTimeSlotRules(tenantId: string): Promise<void> {
  for (const fulfillment of [FulfillmentType.PICKUP, FulfillmentType.DELIVERY]) {
    const rules = await prisma.timeSlotRule.findMany({
      where: { tenantId, fulfillment },
      orderBy: { id: "asc" },
    });
    if (rules.length <= 1) continue;

    const [, ...duplicates] = rules;
    await prisma.timeSlotRule.deleteMany({
      where: { id: { in: duplicates.map((r) => r.id) } },
    });
  }
}
