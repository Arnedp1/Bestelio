import Link from "next/link";
import Image from "next/image";
import { CartBadge } from "./CartBadge";

export function Header({
  brandName,
  logoUrl,
  tagline,
}: {
  brandName: string;
  logoUrl?: string | null;
  tagline?: string;
}) {
  return (
    <header className="glass sticky top-0 z-50 border-b border-stone-200/80">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="group flex min-w-0 items-center gap-3">
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-xl shadow-sm"
            style={{
              background: "linear-gradient(135deg, var(--brand-light), white)",
              border: "1px solid color-mix(in srgb, var(--brand) 20%, transparent)",
            }}
          >
            {logoUrl ? (
              <Image src={logoUrl} alt="" width={32} height={32} className="rounded-lg" unoptimized />
            ) : (
              "🍟"
            )}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-base font-bold tracking-tight text-stone-900 group-hover:text-[var(--brand)]">
              {brandName}
            </span>
            {tagline && (
              <span className="block truncate text-xs text-stone-500">{tagline}</span>
            )}
          </span>
        </Link>
        <CartBadge />
      </div>
    </header>
  );
}
