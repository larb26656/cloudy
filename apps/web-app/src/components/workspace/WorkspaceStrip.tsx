import { useState, useCallback } from "react";
import { Plus } from "lucide-react";
import { CreateWorkspaceDialog } from "./CreateWorkspaceDialog";
import { WorkspaceItem } from "./WorkspaceItem";
import { createWorkspaceStore, type Workspace } from "@/stores/workspaceStore";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { useWorkspaceStore } from "@/stores/workspaceStore.new";

interface WorkspaceStripProps {
  instanceId: string;
  className?: string;
}

export function WorkspaceStrip({ instanceId, className }: WorkspaceStripProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  const [store] = useState(() =>
    instanceId ? createWorkspaceStore(instanceId) : null,
  );

  const {
    workspaces,
    currentWorkspaceId,
    setCurrentWorkspace,
    deleteWorkspace,
  } = useWorkspaceStore();

  const handleSelectWorkspace = useCallback(
    (workspace: Workspace) => {
      setCurrentWorkspace(workspace.id);
    },
    [store],
  );

  const handleDeleteWorkspace = useCallback(
    (workspaceId: string) => {
      if (workspaces.length <= 1) return;
      deleteWorkspace(workspaceId);
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

      <CreateWorkspaceDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  );
}
