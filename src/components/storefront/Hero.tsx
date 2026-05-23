export function Hero({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <section
      className="relative overflow-hidden rounded-2xl px-5 py-8 sm:px-8 sm:py-10"
      style={{
        background:
          "linear-gradient(135deg, var(--brand) 0%, var(--brand-dark) 55%, #9a3412 100%)",
      }}
    >
      <div
        className="pointer-events-none absolute -right-8 -top-8 text-[8rem] opacity-20 select-none"
        aria-hidden
      >
        🍟
      </div>
      <div className="relative">
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">{title}</h1>
        <p className="mt-2 max-w-md text-sm text-orange-100 sm:text-base">{subtitle}</p>
      </div>
    </section>
  );
}
