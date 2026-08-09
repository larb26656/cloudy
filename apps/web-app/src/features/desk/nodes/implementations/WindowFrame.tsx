import { useEffect, useRef, useState } from "react";
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
  headerClassName?: string;
  headerAction?: React.ReactNode;
  actions?: WindowFrameAction[];
  workspaceId?: string;
  /** Override the default close (delete-node) behavior, e.g. to clean up
   * external resources before removing the node. */
  onCloseOverride?: () => void;
  /** When provided, the title becomes double-click editable and committing a
   * non-empty changed name forwards the new title to this callback. */
  onRename?: (newTitle: string) => void;
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
  headerClassName,
  headerAction,
  actions,
  workspaceId,
  onCloseOverride,
  onRename,
}: WindowFrameProps) {
  const defaultClose = useDeleteNode(nodeId);
  const handleClose = onCloseOverride ?? defaultClose;
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(title ?? "");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  const startEditing = () => {
    if (!onRename) return;
    setDraft(title ?? "");
    setIsEditing(true);
  };

  const commitRename = () => {
    const trimmed = draft.trim();
    setIsEditing(false);
    if (trimmed && trimmed !== title && onRename) {
      onRename(trimmed);
    }
  };

  const cancelRename = () => {
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      e.stopPropagation();
      commitRename();
    } else if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      cancelRename();
    }
  };

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
        <div
          className={cn(
            "flex items-center justify-between px-3 py-2 bg-muted border-b cursor-grab active:cursor-grabbing select-none shrink-0",
            headerClassName,
          )}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {headerAction}
            {workspaceId && <WorkspaceDot workspaceId={workspaceId} />}
            {isEditing ? (
              <input
                ref={inputRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={commitRename}
                onKeyDown={handleKeyDown}
                onClick={(e) => e.stopPropagation()}
                className="nodrag min-w-0 flex-1 rounded border border-input bg-background px-1 py-0.5 text-sm font-medium outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
              />
            ) : (
              title && (
                <span
                  onDoubleClick={
                    onRename
                      ? (e) => {
                          e.stopPropagation();
                          startEditing();
                        }
                      : undefined
                  }
                  className={cn(
                    "text-sm font-medium truncate",
                    onRename && "cursor-text",
                  )}
                >
                  {title}
                </span>
              )
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
