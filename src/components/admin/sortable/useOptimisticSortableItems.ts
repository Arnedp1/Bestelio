"use client";

import { useCallback, useState, useTransition } from "react";
import { arrayMove } from "@dnd-kit/sortable";
import type { DragEndEvent } from "@dnd-kit/core";

export function useOptimisticSortableItems<T extends { id: string }>(
  initialItems: T[],
  onCommitOrder: (orderedIds: string[]) => Promise<void>
) {
  const [items, setItems] = useState(initialItems);
  const [isPending, startTransition] = useTransition();
  const serverOrderKey = initialItems.map((item) => item.id).join(",");
  const [syncedOrderKey, setSyncedOrderKey] = useState(serverOrderKey);

  if (!isPending && serverOrderKey !== syncedOrderKey) {
    setSyncedOrderKey(serverOrderKey);
    setItems(initialItems);
  }

  const commitOrder = useCallback(
    (orderedIds: string[]) => {
      const reordered = orderedIds
        .map((id) => items.find((item) => item.id === id))
        .filter((item): item is T => item !== undefined);

      if (reordered.length !== items.length || reordered.length !== orderedIds.length) {
        return;
      }

      const previous = items;
      setItems(reordered);

      startTransition(async () => {
        try {
          await onCommitOrder(orderedIds);
        } catch {
          setItems(previous);
        }
      });
    },
    [items, onCommitOrder]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);
      if (oldIndex < 0 || newIndex < 0) return;

      commitOrder(arrayMove(items, oldIndex, newIndex).map((item) => item.id));
    },
    [items, commitOrder]
  );

  return { items, handleDragEnd, isPending };
}
