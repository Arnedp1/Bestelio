export function slotRemaining(maxOrders: number, bookedCount: number): number {
  return Math.max(0, maxOrders - bookedCount);
}
