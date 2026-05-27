export function slotRemaining(maxRevenueCents: number, bookedRevenueCents: number): number {
  return Math.max(0, maxRevenueCents - bookedRevenueCents);
}
