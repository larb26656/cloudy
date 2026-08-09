import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface DeskPanelProps {
  children: ReactNode;
  className?: string;
}

/**
 * Floating chip container shared by the desk canvas overlays (DeskName, Add
 * node, InteractionToolbar, SelectionToolbar). Uses `nodrag nopan` so pointer
 * events inside don't pan/drag the canvas.
 */
export function DeskPanel({ children, className }: DeskPanelProps) {
  return (
    <div
      className={cn(
        "nodrag nopan flex items-center gap-0.5 rounded-lg border bg-background/95 p-1 shadow-md backdrop-blur supports-[backdrop-filter]:bg-background/80",
        className,
      )}
    >
      {children}
    </div>
  );
}
