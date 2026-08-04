import { FolderOpen } from "lucide-react";

import { Button } from "@/components/ui/button";
import { WorkspaceItem } from "@/components/ui/WorkspaceItem";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { useWorkspaces } from "@/hooks/queries";
import type { Workspace } from "@/lib/cloudy/workspaces";

interface WorkspaceSelectStepProps {
  onSelect: (workspace: Workspace) => void;
  onGoToWorkspaces: () => void;
}

export function WorkspaceSelectStep({
  onSelect,
  onGoToWorkspaces,
}: WorkspaceSelectStepProps) {
  const { data: workspaces = [], isLoading } = useWorkspaces();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        <LoadingState title="Loading workspaces" />
      </div>
    );
  }

  if (workspaces.length === 0) {
    return (
      <EmptyState
        icon={FolderOpen}
        title="No workspaces yet"
        description="Create a workspace first"
        action={<Button onClick={onGoToWorkspaces}>Go to Workspaces</Button>}
      />
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
