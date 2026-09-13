import { FolderOpen } from "lucide-react";

import { Button } from "@repo/ui/components/button";
import { WorkspaceItem } from "@/components/ui/WorkspaceItem";
import { EmptyState } from "@repo/ui/components/empty-state";
import { LoadingState } from "@repo/ui/components/loading-state";
import { useWorkspaces } from "@/hooks/queries";
import type { Workspace, WorkspaceType } from "@/lib/cloudy/workspaces";

interface WorkspaceSelectStepProps {
  onSelect: (workspace: Workspace) => void;
  onGoToWorkspaces: () => void;
  workspaceType?: WorkspaceType;
}

export function WorkspaceSelectStep({
  onSelect,
  onGoToWorkspaces,
  workspaceType,
}: WorkspaceSelectStepProps) {
  const { data: workspaces = [], isLoading } = useWorkspaces();
  const matchingWorkspaces = workspaceType
    ? workspaces.filter((workspace) => workspace.type === workspaceType)
    : workspaces;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        <LoadingState title="Loading workspaces" />
      </div>
    );
  }

  if (matchingWorkspaces.length === 0) {
    return (
      <EmptyState
        icon={FolderOpen}
        title={
          workspaceType
            ? `No ${workspaceType} workspaces yet`
            : "No workspaces yet"
        }
        description="Create a workspace first"
        action={<Button onClick={onGoToWorkspaces}>Go to Workspaces</Button>}
      />
    );
  }

  return (
    <div className="flex flex-col gap-1 flex-1 min-h-0 overflow-y-auto">
      {matchingWorkspaces.map((workspace) => (
        <WorkspaceItem
          key={workspace.id}
          workspace={workspace}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}
