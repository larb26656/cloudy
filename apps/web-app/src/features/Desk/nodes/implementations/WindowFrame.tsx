import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { WorkspaceDot } from "@/components/workspace/WorkspaceDot";
import { useDeleteNode } from "./useDeleteNode";
import { NodeResizeHandles } from "./NodeResizeHandles";

export interface WindowFrameAction {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

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
  actions?: WindowFrameAction[];
  workspaceId?: string;
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
  actions,
  workspaceId,
}: WindowFrameProps) {
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
      <div
        className={cn(
          "rounded-lg border shadow-md bg-background overflow-hidden h-full flex flex-col",
          color,
          className,
        )}
      >
        <div className="flex items-center justify-between px-3 py-2 bg-muted border-b cursor-grab active:cursor-grabbing select-none shrink-0">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {headerAction}
            {workspaceId && <WorkspaceDot workspaceId={workspaceId} />}
            {title && (
              <span className="text-sm font-medium truncate">{title}</span>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {actions?.map((action) => {
              const ActionIcon = action.icon;
              return (
                <button
                  key={action.label}
                  onClick={action.onClick}
                  disabled={action.disabled}
                  title={action.label}
                  aria-label={action.label}
                  className="p-1 hover:bg-muted-foreground/20 rounded disabled:opacity-50 disabled:pointer-events-none"
                >
                  <ActionIcon className="h-4 w-4" />
                </button>
              );
            })}
            <button
              onClick={handleClose}
              className="p-1 hover:bg-muted-foreground/20 rounded"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="nodrag nopan nowheel select-text cursor-auto flex-1 min-h-0 overflow-auto">
          {children}
        </div>
      </div>
    </>
  );
}
