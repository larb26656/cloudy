import type { CSSProperties, ReactNode } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface SortableTabProps {
  id: string;
  children: ReactNode;
}

export function SortableTab({ id, children }: SortableTabProps) {
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
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex" {...attributes}>
      <div ref={setActivatorNodeRef} className="flex" {...listeners}>
        {children}
      </div>
    </div>
  );
}
