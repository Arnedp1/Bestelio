export function AdminCard({
  id,
  title,
  description,
  action,
  children,
  className = "",
}: {
  id?: string;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  const hasHeader = Boolean(title || description || action);

  return (
    <section id={id} className={`admin-card scroll-mt-6 ${className}`.trim()}>
      {hasHeader && (
        <div className="border-b border-stone-100 px-5 py-4">
          <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
            <div className="min-w-0">
              {title && <h2 className="font-semibold text-stone-900">{title}</h2>}
              {description && <p className="mt-0.5 text-sm text-stone-500">{description}</p>}
            </div>
            {action && <div className="shrink-0">{action}</div>}
          </div>
        </div>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}
