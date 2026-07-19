import { NodeResizer } from "@xyflow/react";
import { useReactFlow } from "@xyflow/react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { useCallback } from "react";

interface WindowNodeProps {
  title: string;
  nodeId: string;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  children: React.ReactNode;
  className?: string;
}

export function WindowNode({
  title,
  nodeId,
  minWidth = 300,
  minHeight = 200,
  maxWidth = 800,
  maxHeight = 600,
  children,
  className,
}: WindowNodeProps) {
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
        isVisible={false}
      />
      <div
        className={cn(
          "rounded-lg border shadow-md bg-background overflow-hidden h-full",
          className
        )}
      >
        <div className="flex items-center justify-between px-3 py-2 bg-muted border-b cursor-grab active:cursor-grabbing select-none">
          <span className="text-sm font-medium truncate">{title}</span>
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
