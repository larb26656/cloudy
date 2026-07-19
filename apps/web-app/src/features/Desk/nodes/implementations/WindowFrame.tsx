import { NodeResizer } from "@xyflow/react";
import { useReactFlow } from "@xyflow/react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { useCallback } from "react";

interface WindowFrameProps {
  title?: string;
  nodeId: string;
  selected?: boolean;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  children: React.ReactNode;
  className?: string;
  color?: string;
  headerAction?: React.ReactNode;
}

export function WindowFrame({
  title,
  nodeId,
  selected = false,
  minWidth = 300,
  minHeight = 200,
  maxWidth = 800,
  maxHeight = 600,
  children,
  className,
  color,
  headerAction,
}: WindowFrameProps) {
  const { deleteElements } = useReactFlow();

  const handleClose = useCallback(() => {
    deleteElements({ nodes: [{ id: nodeId }] });
  }, [deleteElements, nodeId]);

  return (
    <>
      <NodeResizer
        minWidth={minWidth}
        minHeight={minHeight}
        maxWidth={maxWidth}
        maxHeight={maxHeight}
        handleClassName="!border-primary !bg-primary/20 hover:!bg-primary/30"
        isVisible={selected}
      />
      <div
        className={cn(
          "rounded-lg border shadow-md bg-background overflow-hidden h-full",
          color,
          className,
        )}
      >
        <div className="flex items-center justify-between px-3 py-2 bg-muted border-b cursor-grab active:cursor-grabbing select-none">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {headerAction}
            {title && <span className="text-sm font-medium truncate">{title}</span>}
          </div>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-muted-foreground/20 rounded"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="nodrag nopan nowheel h-full overflow-auto">
          {children}
        </div>
      </div>
    </>
  );
}
