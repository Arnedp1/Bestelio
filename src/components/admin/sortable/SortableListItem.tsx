"use client";

import type { CSSProperties, ReactNode } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { SortableHandleProps } from "./types";

type Props = {
  id: string;
  className?: string;
  children: (handle: SortableHandleProps) => ReactNode;
};

export function SortableListItem({ id, className = "", children }: Props) {
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
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`list-none ${isDragging ? "sortable-item-dragging" : ""} ${className}`.trim()}
    >
      {children({ setActivatorNodeRef, attributes, listeners, isDragging })}
    </li>
  );
}
