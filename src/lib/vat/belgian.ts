/** Belgian reduced VAT rate for food (takeaway / horeca context). */
export const BE_FOOD_VAT_RATE = 6;

/** Split VAT-inclusive amount into excl. base and VAT (rounded to cents). */
export function splitInclusiveVatCents(
  amountInclCents: number,
  ratePercent: number = BE_FOOD_VAT_RATE
): { exclCents: number; vatCents: number } {
  if (amountInclCents <= 0) {
    return { exclCents: 0, vatCents: 0 };
  }
  const factor = 1 + ratePercent / 100;
  const exclCents = Math.round(amountInclCents / factor);
  const vatCents = amountInclCents - exclCents;
  return { exclCents, vatCents };
}

export function sumVatBreakdown(
  lines: { exclCents: number; vatCents: number }[]
): { exclCents: number; vatCents: number; inclCents: number } {
  const exclCents = lines.reduce((s, l) => s + l.exclCents, 0);
  const vatCents = lines.reduce((s, l) => s + l.vatCents, 0);
  return { exclCents, vatCents, inclCents: exclCents + vatCents };
}
