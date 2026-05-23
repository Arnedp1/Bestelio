import Link from "next/link";
import { getCart } from "@/lib/cart/cookie";
import { resolveCartForTenant } from "@/lib/cart/resolve";
import { requireTenant } from "@/lib/tenant/context";
import { cartLineKey, cartSubtotalCents } from "@/lib/cart/types";
import { formatCents } from "@/lib/utils/money";
import { StorefrontShell } from "@/components/storefront/StorefrontShell";
import { CartStaleSync } from "@/components/storefront/CartStaleSync";
import { CartLineList } from "@/components/storefront/CartLineList";

export default async function CartPage() {
  const tenant = await requireTenant();
  const rawCart = await getCart();
  const { cart, hadStaleLines } = await resolveCartForTenant(tenant.id, rawCart);
  const subtotal = cartSubtotalCents(cart);

  return (
    <StorefrontShell>
      {hadStaleLines && <CartStaleSync />}

      <div className="cart-page mx-auto w-full max-w-md">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm font-medium text-stone-500 hover:text-[var(--brand)]"
        >
          ← Terug naar menu
        </Link>

        <h1 className="mt-3 text-xl font-bold text-stone-900">Je winkelmand</h1>

        {hadStaleLines && cart.lines.length > 0 && (
          <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Sommige producten waren niet meer beschikbaar en zijn uit je mand verwijderd.
          </p>
        )}

        {cart.lines.length === 0 ? (
          <div className="card mt-4 p-6 text-center">
            <p className="text-4xl">🛒</p>
            <p className="mt-3 font-medium text-stone-600">
              {hadStaleLines
                ? "Je mand bevat geen geldige producten meer"
                : "Je mand is nog leeg"}
            </p>
            <Link href="/" className="btn-primary mt-5 inline-flex">
              Bekijk het menu
            </Link>
          </div>
        ) : (
          <>
            <CartLineList
              className="mt-4"
              lines={cart.lines.map((line) => ({
                ...line,
                lineKey: cartLineKey(line),
              }))}
            />

            <div className="card mt-4 p-4">
              <div className="flex justify-between text-base font-bold">
                <span>Totaal</span>
                <span className="text-[var(--brand)]">{formatCents(subtotal)}</span>
              </div>
              <Link href="/checkout" className="btn-primary mt-3 flex w-full">
                Afrekenen →
              </Link>
              <Link href="/" className="btn-secondary mt-2 flex w-full text-sm">
                Verder bestellen
              </Link>
            </div>
          </>
        )}
      </div>
    </StorefrontShell>
  );
}
