import { useState, useCallback } from "react";
import { ChevronDown, Plus, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CreateWorkspaceDialog } from "./CreateWorkspaceDialog";
import { useWorkspaceStore, type Workspace } from "@/stores/workspaceStore";
import { cn } from "@/lib/utils";

interface WorkspaceSelectorProps {
  instanceId: string;
  className?: string;
}

export function WorkspaceSelector({ instanceId, className }: WorkspaceSelectorProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  const workspaces = useWorkspaceStore((state) => state.workspaces.filter((w) => w.instanceId === instanceId));
  const currentWorkspaceId = useWorkspaceStore((state) => state.currentWorkspaceId);
  const setCurrentWorkspace = useWorkspaceStore((state) => state.setCurrentWorkspace);
  const deleteWorkspace = useWorkspaceStore((state) => state.deleteWorkspace);

  const currentWorkspace = workspaces.find((w) => w.id === currentWorkspaceId);

  const handleDialogOpenChange = (open: boolean) => {
    setDialogOpen(open);
  };

  const handleSelectWorkspace = useCallback(
    (workspace: Workspace) => {
      setCurrentWorkspace(workspace.id);
    },
    [setCurrentWorkspace],
  );

  const handleDeleteWorkspace = useCallback(
    (e: React.MouseEvent, workspaceId: string) => {
      e.stopPropagation();
      if (workspaces.length <= 1) return;
      deleteWorkspace(workspaceId);
    },
    [deleteWorkspace, workspaces.length],
  );

  return (
    <div className={cn(["p-2", className])}>
      <DropdownMenu>
        <DropdownMenuTrigger className="w-full flex items-center justify-between h-auto py-2 px-3 rounded-md hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground">
          <div className="flex items-center gap-2 min-w-0">
            {currentWorkspace ? (
              <>
                <div
                  className="size-3 rounded-full shrink-0"
                  style={{ backgroundColor: currentWorkspace.color }}
                />
                <span className="truncate">{currentWorkspace.name}</span>
              </>
            ) : (
              <>
                <div className="size-3 rounded-full bg-muted shrink-0" />
                <span className="truncate text-muted-foreground">
                  Select workspace
                </span>
              </>
            )}
          </div>
          <ChevronDown className="size-4 shrink-0" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-[calc(100%-1rem)]">
          {workspaces.map((workspace) => (
            <DropdownMenuItem
              key={workspace.id}
              onClick={() => handleSelectWorkspace(workspace)}
              className="gap-2 cursor-pointer"
            >
              <div
                className="size-3 rounded-full shrink-0"
                style={{ backgroundColor: workspace.color }}
              />
              <span className="truncate flex-1">{workspace.name}</span>
              {workspaces.length > 1 && (
                <button
                  onClick={(e) => handleDeleteWorkspace(e, workspace.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/10 rounded cursor-pointer"
                >
                  <Trash2 className="size-3 text-muted-foreground hover:text-destructive" />
                </button>
              )}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setDialogOpen(true)}
            className="gap-2 cursor-pointer"
          >
            <Plus className="size-4" />
            New workspace
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <CreateWorkspaceDialog
        open={dialogOpen}
        onOpenChange={handleDialogOpenChange}
      />
    </div>
  );
}
