"use client";

import { useId } from "react";
import { DndContext, closestCenter } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { SortableListItem } from "./sortable/SortableListItem";
import { useSortableSensors } from "./sortable/sensors";
import { useOptimisticSortableItems } from "./sortable/useOptimisticSortableItems";
import type { SortableHandleProps } from "./sortable/types";

type SortableListProps<T extends { id: string }> = {
  items: T[];
  onReorder: (orderedIds: string[]) => Promise<void>;
  renderItem: (item: T, handle: SortableHandleProps) => React.ReactNode;
  className?: string;
  listClassName?: string;
  emptyMessage?: string;
};

export function SortableList<T extends { id: string }>({
  items: initialItems,
  onReorder,
  renderItem,
  className = "",
  listClassName = "space-y-2",
  emptyMessage,
}: SortableListProps<T>) {
  const dndContextId = useId();
  const sensors = useSortableSensors();
  const { items, handleDragEnd, isPending } = useOptimisticSortableItems(
    initialItems,
    onReorder
  );

  if (items.length === 0 && emptyMessage) {
    return <p className="text-sm text-stone-500">{emptyMessage}</p>;
  }

  return (
    <div className={className}>
      {isPending && (
        <p className="mb-2 text-xs font-medium text-orange-600">Volgorde opslaan…</p>
      )}
      <DndContext
        id={dndContextId}
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={items.map((item) => item.id)}
          strategy={verticalListSortingStrategy}
        >
          <ul className={listClassName}>
            {items.map((item) => (
              <SortableListItem key={item.id} id={item.id}>
                {(handle) => renderItem(item, handle)}
              </SortableListItem>
            ))}
          </ul>
        </SortableContext>
      </DndContext>
    </div>
  );
}
