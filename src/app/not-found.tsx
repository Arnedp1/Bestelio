import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-pattern px-4 text-center">
      <p className="text-6xl">🍟</p>
      <h1 className="mt-4 text-2xl font-bold text-stone-900">Niet gevonden</h1>
      <p className="mt-2 max-w-sm text-stone-500">
        Deze pagina of dit domein is niet gekoppeld aan een bestelomgeving.
      </p>
      <p className="mt-3 max-w-sm text-xs text-stone-400">
        Lokaal testen? Open{" "}
        <a href="http://localhost:3000" className="font-medium text-[var(--brand)] underline">
          http://localhost:3000
        </a>{" "}
        in plaats van 127.0.0.1.
      </p>
      <Link href="/" className="btn-primary mt-8">
        Naar home
      </Link>
    </div>
  );
}
