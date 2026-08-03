import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { useDeleteNode } from "./useDeleteNode";
import { NodeResizeHandles } from "./NodeResizeHandles";

interface FramelessNodeProps {
  nodeId: string;
  selected?: boolean;
  title?: string;
  toolbar?: React.ReactNode;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  children: React.ReactNode;
  className?: string;
  color?: string;
}

export function FramelessNode({
  nodeId,
  selected = false,
  title,
  toolbar,
  minWidth = 200,
  minHeight = 120,
  maxWidth = 800,
  maxHeight = 600,
  children,
  className,
  color,
}: FramelessNodeProps) {
  const handleClose = useDeleteNode(nodeId);

  return (
    <>
      <NodeResizeHandles
        isVisible={selected}
        minWidth={minWidth}
        minHeight={minHeight}
        maxWidth={maxWidth}
        maxHeight={maxHeight}
      />
      {selected && toolbar && (
        <div className="nodrag absolute -top-9 left-0 z-20 flex items-center gap-1">
          {toolbar}
        </div>
      )}
      <div
        className={cn(
          "relative h-full flex flex-col overflow-hidden",
          color,
          selected &&
            "rounded-lg border bg-background shadow-md",
          className,
        )}
      >
        {selected && (
          <div className="flex items-center gap-2 border-b bg-muted/40 px-2 py-1 text-xs text-muted-foreground cursor-grab active:cursor-grabbing">
            <span className="truncate font-medium">{title}</span>
            <button
              onClick={handleClose}
              title="Delete"
              aria-label="Delete node"
              className="nodrag ml-auto rounded p-0.5 hover:bg-muted-foreground/20"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
        <div className="nodrag nopan nowheel select-text cursor-auto flex-1 min-h-0 overflow-hidden">
          {children}
        </div>
      </div>
    </>
  );
}
