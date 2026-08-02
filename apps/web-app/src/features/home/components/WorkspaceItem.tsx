import { Settings2, Trash2, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { Workspace } from "@/lib/cloudy/workspaces";

interface WorkspaceItemProps {
  workspace: Workspace;
  selected: boolean;
  onSelect: (id: string) => void;
  onEdit: (workspace: Workspace) => void;
  onDelete: (workspace: Workspace) => void;
}

export function WorkspaceItem({
  workspace,
  selected,
  onSelect,
  onEdit,
  onDelete,
}: WorkspaceItemProps) {
  return (
    <div
      className={cn(
        "group flex items-center gap-1 rounded-md px-2 py-1.5 text-sm hover:bg-muted",
        selected && "bg-muted font-medium",
      )}
    >
      <button
        type="button"
        onClick={() => onSelect(workspace.id)}
        className="flex min-w-0 flex-1 items-center gap-2"
      >
        <span
          className="flex size-5 shrink-0 items-center justify-center rounded text-xs font-semibold text-white"
          style={{ backgroundColor: workspace.color }}
        >
          {workspace.name.charAt(0).toUpperCase()}
        </span>
        <span className="truncate">{workspace.name}</span>
      </button>

      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <button
              type="button"
              className="flex size-5 shrink-0 items-center justify-center rounded opacity-0 transition-opacity group-hover:opacity-100 hover:bg-accent"
            >
              <MoreVertical className="size-3.5" />
            </button>
          }
        />
        <DropdownMenuContent align="end" sideOffset={4}>
          <DropdownMenuItem onClick={() => onEdit(workspace)}>
            <Settings2 data-icon="inline-start" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onClick={() => onDelete(workspace)}
          >
            <Trash2 data-icon="inline-start" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
