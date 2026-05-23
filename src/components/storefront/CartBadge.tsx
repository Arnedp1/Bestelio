import Link from "next/link";
import { getCart } from "@/lib/cart/cookie";
import { cartSubtotalCents } from "@/lib/cart/types";
import { formatCents } from "@/lib/utils/money";

export async function CartBadge() {
  const cart = await getCart();
  const count = cart.lines.reduce((n, l) => n + l.quantity, 0);
  const subtotal = cartSubtotalCents(cart);

  return (
    <Link
      href="/cart"
      className="relative flex items-center gap-2 rounded-full bg-stone-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-stone-800"
    >
      <span aria-hidden>🛒</span>
      <span>Winkelmand</span>
      {count > 0 && (
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--brand)] px-1.5 text-xs font-bold text-white">
          {count}
        </span>
      )}
      {count > 0 && (
        <span className="hidden text-stone-300 sm:inline">{formatCents(subtotal)}</span>
      )}
    </Link>
  );
}
