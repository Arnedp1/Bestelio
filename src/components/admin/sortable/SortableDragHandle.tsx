"use client";

import type { SortableHandleProps } from "./types";

type Props = SortableHandleProps & {
  label?: string;
  className?: string;
};

export function SortableDragHandle({
  setActivatorNodeRef,
  attributes,
  listeners,
  isDragging,
  label = "Verslepen om volgorde te wijzigen",
  className = "",
}: Props) {
  const { "aria-describedby": _describedBy, ...restAttributes } = attributes;
  void _describedBy;

  return (
    <button
      ref={setActivatorNodeRef}
      type="button"
      className={`sortable-handle touch-none ${isDragging ? "sortable-handle-active" : ""} ${className}`.trim()}
      aria-label={label}
      title="Verslepen"
      {...restAttributes}
      {...listeners}
    >
      <span aria-hidden>⋮⋮</span>
    </button>
  );
}
