"use client";

import { useId } from "react";
import {
  DndContext,
  closestCenter,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { SortableDragHandle } from "./sortable/SortableDragHandle";
import { SortableRowTr } from "./sortable/SortableRowTr";
import { useSortableSensors } from "./sortable/sensors";
import { useOptimisticSortableItems } from "./sortable/useOptimisticSortableItems";
import type { SortableHandleProps } from "./sortable/types";

type SortableTableProps<T extends { id: string }> = {
  items: T[];
  onReorder: (orderedIds: string[]) => Promise<void>;
  columns: { header: string; className?: string }[];
  renderRow: (item: T, handle: SortableHandleProps) => React.ReactNode;
  emptyMessage?: string;
  tableClassName?: string;
  colgroup?: React.ReactNode;
};

export function SortableTable<T extends { id: string }>({
  items: initialItems,
  onReorder,
  columns,
  renderRow,
  emptyMessage = "Geen items",
  tableClassName = "",
  colgroup,
}: SortableTableProps<T>) {
  const dndContextId = useId();
  const isProductsTable = tableClassName.includes("admin-products-table");
  const handleColClass = isProductsTable ? "admin-products-col-handle" : "w-10";
  const sensors = useSortableSensors();
  const { items, handleDragEnd, isPending } = useOptimisticSortableItems(
    initialItems,
    onReorder
  );

  if (items.length === 0) {
    return <p className="text-sm text-stone-500">{emptyMessage}</p>;
  }

  return (
    <div>
      {isPending && (
        <p className="mb-2 text-xs font-medium text-orange-600">Volgorde opslaan…</p>
      )}
      <div className="-mx-5 -mb-5 overflow-x-auto">
        <DndContext
          id={dndContextId}
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <table
            className={`admin-table sortable-table w-full text-left text-sm ${tableClassName}`.trim()}
          >
            {colgroup}
            <thead>
              <tr>
                <th className={handleColClass} aria-label="Volgorde" />
                {columns.map((col) => (
                  <th key={col.header} className={col.className}>
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <SortableContext
                items={items.map((item) => item.id)}
                strategy={verticalListSortingStrategy}
              >
                {items.map((item) => (
                  <SortableRowTr key={item.id} id={item.id}>
                    {(handle) => (
                      <>
                        <td className={`${handleColClass} align-middle`}>
                          <SortableDragHandle {...handle} />
                        </td>
                        {renderRow(item, handle)}
                      </>
                    )}
                  </SortableRowTr>
                ))}
              </SortableContext>
            </tbody>
          </table>
        </DndContext>
      </div>
    </div>
  );
}
