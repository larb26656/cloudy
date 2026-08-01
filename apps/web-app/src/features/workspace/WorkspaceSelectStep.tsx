import { FolderOpen } from "lucide-react";

import { Button } from "@/components/ui/button";
import { WorkspaceItem } from "@/components/ui/WorkspaceItem";
import { useWorkspaceStore, type Workspace } from "@/stores/workspaceStore";

interface WorkspaceSelectStepProps {
  onSelect: (workspace: Workspace) => void;
  onGoToWorkspaces: () => void;
}

export function WorkspaceSelectStep({
  onSelect,
  onGoToWorkspaces,
}: WorkspaceSelectStepProps) {
  const workspaces = useWorkspaceStore((s) => s.workspaces);

  if (workspaces.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        <FolderOpen className="size-12 text-muted-foreground" />
        <div>
          <p className="font-medium">No workspaces yet</p>
          <p className="text-sm text-muted-foreground">
            Create a workspace first
          </p>
        </div>
        <Button onClick={onGoToWorkspaces}>Go to Workspaces</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1 flex-1 min-h-0 overflow-y-auto">
      {workspaces.map((workspace) => (
        <WorkspaceItem
          key={workspace.id}
          workspace={workspace}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}
