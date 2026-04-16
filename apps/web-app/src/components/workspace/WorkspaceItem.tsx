import { useCallback } from "react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import type { Workspace } from "@/stores/workspaceStore";
import { cn } from "@/lib/utils";

interface WorkspaceItemProps {
  workspace: Workspace;
  isSelected: boolean;
  onSelect: (workspace: Workspace) => void;
  onEdit: (workspace: Workspace) => void;
  onDelete: (workspaceId: string) => void;
  canDelete: boolean;
}

export function WorkspaceItem({
  workspace,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  canDelete,
}: WorkspaceItemProps) {
  const initial = workspace.name.charAt(0).toUpperCase();

  const handleClick = useCallback(() => {
    onSelect(workspace);
  }, [onSelect, workspace]);

  const handleEdit = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onEdit(workspace);
    },
    [onEdit, workspace],
  );

  const handleDelete = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onDelete(workspace.id);
    },
    [onDelete, workspace.id],
  );

  return (
    <ContextMenu>
      <Tooltip>
        <TooltipTrigger
          render={
            <ContextMenuTrigger
              render={
                <button
                  onClick={handleClick}
                  className={cn(
                    "relative size-12 rounded-xl flex items-center justify-center text-lg font-semibold transition-all duration-200 cursor-pointer",
                    isSelected ? "border-2 border-primary" : "border-0",
                  )}
                  style={{ backgroundColor: workspace.color }}
                >
                  <span className="text-white">{initial}</span>
                </button>
              }
            />
          }
        />
        <TooltipContent side="right" sideOffset={8}>
          {workspace.name}
        </TooltipContent>
      </Tooltip>
      <ContextMenuContent alignOffset={4} side="right">
        <ContextMenuItem onClick={handleEdit}>Edit workspace</ContextMenuItem>
        <ContextMenuItem
          className="text-destructive focus:text-destructive"
          onClick={handleDelete}
          disabled={!canDelete}
        >
          Delete workspace
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
