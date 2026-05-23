import { prisma } from "@/lib/prisma";
import { getNextAvailableSlot } from "./availability";

export type BookSlotResult =
  | { ok: true; slotId: string }
  | { ok: false; reason: "slot_full" | "slot_blocked" | "slot_not_found"; suggestedSlotId?: string };

export async function bookTimeSlot(params: {
  tenantId: string;
  slotInstanceId: string;
}): Promise<BookSlotResult> {
  return prisma.$transaction(async (tx) => {
    const slot = await tx.timeSlotInstance.findFirst({
      where: { id: params.slotInstanceId, tenantId: params.tenantId },
    });

    if (!slot) return { ok: false, reason: "slot_not_found" };
    if (slot.isBlocked) return { ok: false, reason: "slot_blocked" };

    const updated = await tx.$executeRaw`
      UPDATE "TimeSlotInstance"
      SET "bookedCount" = "bookedCount" + 1
      WHERE "id" = ${params.slotInstanceId}
        AND "tenantId" = ${params.tenantId}
        AND "bookedCount" < "maxOrders"
        AND "isBlocked" = false
    `;

    if (Number(updated) < 1) {
      const next = await getNextAvailableSlot({
        tenantId: params.tenantId,
        fulfillment: slot.fulfillment,
        after: slot.startsAt,
        excludeId: slot.id,
      });
      return {
        ok: false,
        reason: "slot_full",
        suggestedSlotId: next?.id,
      };
    }

    return { ok: true, slotId: slot.id };
  });
}

export async function releaseTimeSlot(params: {
  tenantId: string;
  slotInstanceId: string;
}): Promise<void> {
  await prisma.$executeRaw`
    UPDATE "TimeSlotInstance"
    SET "bookedCount" = GREATEST("bookedCount" - 1, 0)
    WHERE "id" = ${params.slotInstanceId} AND "tenantId" = ${params.tenantId}
  `;
}
