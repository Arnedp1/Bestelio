import { toggleSlotBlocked } from "../actions";

type Row = {
  id: string;
  startsAt: Date;
  maxRevenueCents: number;
  bookedRevenueCents: number;
  isBlocked: boolean;
};

function occupancyStatus(row: Row): string | null {
  if (row.isBlocked) return "dicht";
  if (row.bookedRevenueCents >= row.maxRevenueCents) return "omzetdoel bereikt";
  return null;
}

export function SlotsTodaySection({
  title,
  rows,
  showHeading = true,
}: {
  title?: string;
  rows: Row[];
  showHeading?: boolean;
}) {
  return (
    <section>
      {showHeading && title && (
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-400">
          {title}
        </h4>
      )}

      {rows.length === 0 ? (
        <p className="text-sm text-stone-500">Geen tijdslots (geen regel of vandaag gesloten).</p>
      ) : (
        <table className="admin-table admin-slots-today-table w-full text-left text-sm">
          <colgroup>
            <col className="admin-slots-col-time" />
            <col className="admin-slots-col-occupancy" />
            <col className="admin-slots-col-action" />
          </colgroup>
          <thead>
            <tr>
              <th>Tijd</th>
              <th>Omzet</th>
              <th className="text-right">Actie</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const status = occupancyStatus(row);
              return (
                <tr key={row.id} className={row.isBlocked ? "bg-stone-50 text-stone-500" : ""}>
                  <td className="font-medium tabular-nums">
                    {row.startsAt.toLocaleTimeString("nl-BE", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="tabular-nums">
                    <span className="block">
                      € {(row.bookedRevenueCents / 100).toFixed(2)} / €{" "}
                      {(row.maxRevenueCents / 100).toFixed(2)}
                    </span>
                    <span
                      className={`block h-4 text-xs leading-4 ${
                        status ? "text-stone-500" : "invisible"
                      }`}
                      aria-hidden={!status}
                    >
                      {status ?? "—"}
                    </span>
                  </td>
                  <td className="text-right">
                    <form action={toggleSlotBlocked} className="inline-block w-full">
                      <input type="hidden" name="id" value={row.id} />
                      <input type="hidden" name="blocked" value={String(!row.isBlocked)} />
                      <button
                        type="submit"
                        className="admin-slots-action-btn text-xs font-semibold text-orange-600 hover:underline"
                      >
                        {row.isBlocked ? "Openzetten" : "Sluiten"}
                      </button>
                    </form>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </section>
  );
}
