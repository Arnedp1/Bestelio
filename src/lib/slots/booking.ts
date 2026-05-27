import { prisma } from "@/lib/prisma";

export type BookSlotResult =
  | { ok: true; slotId: string }
  | { ok: false; reason: "slot_blocked" | "slot_not_found" };

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

    return { ok: true, slotId: slot.id };
  });
}

export async function releaseTimeSlot(params: {
  tenantId: string;
  slotInstanceId: string;
}): Promise<void> {
  void params;
}
