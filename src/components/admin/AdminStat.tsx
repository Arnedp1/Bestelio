export function AdminStat({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string | number;
  hint?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`admin-card p-4 ${accent ? "border-orange-200 bg-gradient-to-br from-orange-50 to-white" : ""}`}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${accent ? "text-orange-600" : "text-stone-900"}`}>
        {value}
      </p>
      {hint && <p className="mt-0.5 text-xs text-stone-400">{hint}</p>}
    </div>
  );
}
