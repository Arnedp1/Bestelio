"use client";

import type { CSSProperties, ReactNode } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { SortableHandleProps } from "./types";

type Props = {
  id: string;
  children: (handle: SortableHandleProps) => ReactNode;
};

export function SortableRowTr({ id, children }: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    position: "relative",
    zIndex: isDragging ? 2 : undefined,
    background: isDragging ? "rgb(255 251 247)" : undefined,
    boxShadow: isDragging ? "inset 3px 0 0 #ea580c" : undefined,
  };

  return (
    <tr ref={setNodeRef} style={style} className={isDragging ? "sortable-table-row-dragging" : undefined}>
      {children({ setActivatorNodeRef, attributes, listeners, isDragging })}
    </tr>
  );
}
