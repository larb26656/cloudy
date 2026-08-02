import { useState } from "react";
import { Plus, Settings2, Trash2 } from "lucide-react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

import { useWorkspaceStore } from "@/stores/workspaceStore";
import { WorkspaceDialog } from "@/features/workspace/WorkspaceDialog";
import type { Workspace } from "@/stores/workspaceStore";

interface WorkspaceStripProps {
  instanceId: string;
  className?: string;
}

export function WorkspaceStrip({ instanceId, className }: WorkspaceStripProps) {
  void instanceId;
  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const selectedWorkspaceId = useWorkspaceStore((s) => s.selectedWorkspaceId);
  const selectWorkspace = useWorkspaceStore((s) => s.selectWorkspace);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingWorkspace, setEditingWorkspace] = useState<Workspace | null>(
    null,
  );

  const handleWorkspaceClick = (workspace: Workspace) => {
    selectWorkspace(workspace.id);
  };

  const handleEdit = (workspace: Workspace) => {
    setEditingWorkspace(workspace);
    setModalOpen(true);
  };

  const handleCreateWorkspace = () => {
    setEditingWorkspace(null);
    setModalOpen(true);
  };

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
            <DropdownMenu key={workspace.id}>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <DropdownMenuTrigger
                      render={
                        <button
                          type="button"
                          onClick={() => handleWorkspaceClick(workspace)}
                          className={cn(
                            "size-12 rounded-xl flex items-center justify-center text-sm font-semibold text-white transition-all duration-200 hover:rounded-[16px]",
                            selectedWorkspaceId === workspace.id &&
                              "ring-2 ring-primary",
                          )}
                          style={{ backgroundColor: workspace.color }}
                        >
                          {workspace.name.charAt(0).toUpperCase()}
                        </button>
                      }
                    />
                  }
                />
                <TooltipContent side="right" sideOffset={8}>
                  {workspace.name}
                </TooltipContent>
              </Tooltip>

              <DropdownMenuContent align="start" side="right" sideOffset={8}>
                <DropdownMenuItem onClick={() => handleEdit(workspace)}>
                  <Settings2 data-icon="inline-start" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => handleEdit(workspace)}
                >
                  <Trash2 data-icon="inline-start" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ))}
        </div>

        <div className="pb-3">
          <Tooltip>
            <TooltipTrigger
              render={
                <button
                  className="size-12 rounded-xl flex items-center justify-center bg-muted hover:bg-muted/80 transition-all duration-200 hover:rounded-[16px]"
                  onClick={handleCreateWorkspace}
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

      <WorkspaceDialog
        open={modalOpen}
        onOpenChange={setModalOpen}
        workspace={editingWorkspace}
      />
    </>
  );
}
