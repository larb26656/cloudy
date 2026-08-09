import { cn } from "@/lib/utils";
import { NodeResizeHandles } from "./NodeResizeHandles";

interface FramelessNodeProps {
  selected?: boolean;
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
  selected = false,
  toolbar,
  minWidth = 200,
  minHeight = 120,
  maxWidth = 800,
  maxHeight = 600,
  children,
  className,
  color,
}: FramelessNodeProps) {
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
          "relative h-full flex flex-col overflow-hidden cursor-grab active:cursor-grabbing",
          color,
          selected && "rounded-lg border bg-background shadow-md",
          className,
        )}
      >
        <div className="nopan nowheel select-text flex-1 min-h-0 overflow-hidden">
          {children}
        </div>
      </div>
    </>
  );
}
