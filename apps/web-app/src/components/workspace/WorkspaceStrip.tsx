import { useState, useEffect, useCallback } from "react";
import { Plus } from "lucide-react";
import { CreateWorkspaceDialog } from "./CreateWorkspaceDialog";
import { WorkspaceItem } from "./WorkspaceItem";
import { createWorkspaceStore, type Workspace } from "@/stores/workspaceStore";
import { getStore } from "@/stores/instance/instanceScopeHook";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

interface WorkspaceStripProps {
  instanceId: string;
  className?: string;
}

export function WorkspaceStrip({ instanceId, className }: WorkspaceStripProps) {
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

  const handleDialogOpenChange = (open: boolean) => {
    setDialogOpen(open);
    if (open === false) {
      setDialogCloseCount((c) => c + 1);
    }
  };

  const handleSelectWorkspace = useCallback(
    (workspace: Workspace) => {
      store?.getState().setCurrentWorkspace(workspace.id);
      const directoryStore = getStore("directory", workspace.instanceId);
      directoryStore.getState().setSelectedDirectory(workspace.directory);
    },
    [store],
  );

  const handleDeleteWorkspace = useCallback(
    (workspaceId: string) => {
      if (workspaces.length <= 1) return;
      store?.getState().deleteWorkspace(workspaceId);
    },
    [store, workspaces.length],
  );

  if (!store) return null;

  return (
    <>
      <div
        className={cn(
          "flex flex-col items-center w-[72px] h-full border-r bg-sidebar transition-colors",
          className,
        )}
      >
        <div className="flex flex-col items-center flex-1 w-full py-3 gap-2 overflow-y-auto scrollbar-hidden">
          {workspaces.map((workspace) => (
            <WorkspaceItem
              key={workspace.id}
              workspace={workspace}
              isSelected={workspace.id === currentWorkspaceId}
              onSelect={handleSelectWorkspace}
              onDelete={handleDeleteWorkspace}
              canDelete={workspaces.length > 1}
            />
          ))}
        </div>

        <div className="pb-3">
          <Tooltip>
            <TooltipTrigger
              render={
                <button
                  onClick={() => setDialogOpen(true)}
                  className="size-12 rounded-xl flex items-center justify-center bg-muted hover:bg-muted/80 transition-all duration-200 hover:rounded-[16px]"
                >
                  <Plus className="size-5 text-foreground" />
                </button>
              }
            />
            <TooltipContent side="right" sideOffset={8}>
              New workspace
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      <CreateWorkspaceDialog
        open={dialogOpen}
        onOpenChange={handleDialogOpenChange}
      />
    </>
  );
}
