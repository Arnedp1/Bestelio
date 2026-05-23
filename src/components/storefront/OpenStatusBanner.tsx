import type { OpenStatus } from "@/lib/hours/is-open";
import { formatOpenStatusMessage } from "@/lib/hours/is-open";

export function OpenStatusBanner({ status }: { status: OpenStatus }) {
  const isOpen = status.state === "open";
  const message = formatOpenStatusMessage(status);

  return (
    <div
      role="status"
      aria-live="polite"
      className={
        isOpen
          ? "border-b border-emerald-200/80 bg-emerald-50 text-emerald-900"
          : "border-b border-stone-200 bg-stone-100 text-stone-700"
      }
    >
      <p className="mx-auto max-w-4xl px-4 py-2.5 text-center text-sm font-medium sm:px-6">
        <span className="inline-flex items-center justify-center gap-2">
          <span
            className={`h-2 w-2 shrink-0 rounded-full ${isOpen ? "bg-emerald-500" : "bg-stone-400"}`}
            aria-hidden
          />
          {message}
        </span>
      </p>
    </div>
  );
}
