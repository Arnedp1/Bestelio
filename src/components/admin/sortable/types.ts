import type { DraggableAttributes } from "@dnd-kit/core";

export type SortableHandleProps = {
  setActivatorNodeRef: (element: HTMLElement | null) => void;
  attributes: DraggableAttributes;
  listeners: Record<string, unknown> | undefined;
  isDragging: boolean;
};
