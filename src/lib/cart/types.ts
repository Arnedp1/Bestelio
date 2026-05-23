export type CartLineModifier = {
  optionId: string;
  name: string;
  priceCents: number;
};

export type CartLine = {
  productId: string;
  slug: string;
  name: string;
  unitPriceCents: number;
  quantity: number;
  modifiers: CartLineModifier[];
};

export type Cart = {
  lines: CartLine[];
};

export function cartLineKey(line: CartLine): string {
  const mods = line.modifiers
    .map((m) => m.optionId)
    .sort()
    .join(",");
  return `${line.productId}:${mods}`;
}

export function cartQuantityForProduct(cart: Cart, productId: string): number {
  return cart.lines
    .filter((l) => l.productId === productId)
    .reduce((sum, l) => sum + l.quantity, 0);
}

export function cartSubtotalCents(cart: Cart): number {
  return cart.lines.reduce((sum, line) => {
    const modTotal = line.modifiers.reduce((m, o) => m + o.priceCents, 0);
    return sum + (line.unitPriceCents + modTotal) * line.quantity;
  }, 0);
}
