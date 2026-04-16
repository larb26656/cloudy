import { useState, useEffect, useCallback } from "react";
import { ChevronDown, Plus, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CreateWorkspaceDialog } from "./CreateWorkspaceDialog";
import {
  createWorkspaceStore,
  type Workspace,
} from "@/stores/workspaceStore";
import { cn } from "@/lib/utils";

interface WorkspaceSelectorProps {
  instanceId: string;
  className?: string;
}

export function WorkspaceSelector({ instanceId, className }: WorkspaceSelectorProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogCloseCount, setDialogCloseCount] = useState(0);

  const [store] = useState(() =>
    instanceId ? createWorkspaceStore(instanceId) : null,
  );

  const [workspaces, setWorkspaces] = useState<Workspace[]>(
    () => store?.getState().workspaces ?? [],
  );
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string | null>(
    () => store?.getState().currentWorkspaceId ?? null,
  );

  useEffect(() => {
    if (!store) return;
    const unsub = store.subscribe(() => {
      const state = store.getState();
      setWorkspaces(state.workspaces);
      setCurrentWorkspaceId(state.currentWorkspaceId);
    });
    return unsub;
  }, [store]);

  useEffect(() => {
    if (!store) return;
    setWorkspaces(store.getState().workspaces);
    setCurrentWorkspaceId(store.getState().currentWorkspaceId);
  }, [dialogCloseCount, store]);

  const currentWorkspace = workspaces.find((w) => w.id === currentWorkspaceId);

  const handleDialogOpenChange = (open: boolean) => {
    setDialogOpen(open);
    if (open === false) {
      setDialogCloseCount((c) => c + 1);
    }
  };

  const handleSelectWorkspace = useCallback(
    (workspace: Workspace) => {
      store?.getState().setCurrentWorkspace(workspace.id);
    },
    [store],
  );

  const handleDeleteWorkspace = useCallback(
    (e: React.MouseEvent, workspaceId: string) => {
      e.stopPropagation();
      if (workspaces.length <= 1) return;
      store?.getState().deleteWorkspace(workspaceId);
    },
    [store, workspaces.length],
  );

  if (!store) return null;

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
