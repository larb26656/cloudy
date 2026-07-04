import { useState, useCallback, useMemo } from "react";
import { Plus } from "lucide-react";
import { CreateWorkspaceDialog } from "./CreateWorkspaceDialog";
import { EditWorkspaceDialog } from "./EditWorkspaceDialog";
import { WorkspaceItem } from "./WorkspaceItem";
import { useWorkspaceStore, type Workspace } from "@/stores/workspaceStore";
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
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingWorkspace, setEditingWorkspace] = useState<Workspace | null>(
    null,
  );

  const allWorkspaces = useWorkspaceStore((state) => state.workspaces);
  const currentWorkspaceId = useWorkspaceStore(
    (state) => state.currentWorkspaceId,
  );

  const workspaces = useMemo(
    () => allWorkspaces.filter((w) => w.instanceId === instanceId),
    [allWorkspaces, instanceId],
  );
  const setCurrentWorkspace = useWorkspaceStore(
    (state) => state.setCurrentWorkspace,
  );
  const deleteWorkspace = useWorkspaceStore((state) => state.deleteWorkspace);

  const handleSelectWorkspace = useCallback(
    (workspace: Workspace) => {
      setCurrentWorkspace(workspace.id);
    },
    [setCurrentWorkspace],
  );

  const handleEditWorkspace = useCallback((workspace: Workspace) => {
    setEditingWorkspace(workspace);
  }, []);

  const handleDeleteWorkspace = useCallback(
    (workspaceId: string) => {
      if (workspaces.length <= 1) return;
      deleteWorkspace(workspaceId);
    },
    [deleteWorkspace, workspaces.length],
  );

  return (
    <>
      <div
        className={cn(
          "flex flex-col items-center w-[72px] h-full border-r bg-sidebar transition-colors rounded-l-0 md:rounded-l-2xl",
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
              onEdit={handleEditWorkspace}
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
                  onClick={() => setCreateDialogOpen(true)}
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
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
      {editingWorkspace && (
        <EditWorkspaceDialog
          workspace={editingWorkspace}
          open={true}
          onOpenChange={(open) => {
            if (!open) setEditingWorkspace(null);
          }}
        />
      )}
    </>
  );
}
