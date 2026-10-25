import { useState } from "react";
import { Plus } from "lucide-react";
import { useWorkspaces } from "@/hooks/queries";
import type { Workspace } from "@/lib/cloudy/workspaces";
import { WorkspaceDialog } from "@/features/workspace/WorkspaceDialog";
import { Button } from "@repo/ui/components/button";
import { EmptyState } from "@repo/ui/components/empty-state";
import { ErrorState } from "@repo/ui/components/error-state";
import { LoadingState } from "@repo/ui/components/loading-state";
import { WorkspaceCard } from "../components/WorkspaceCard";
import { WorkspaceDetail } from "../components/WorkspaceDetail";
import { BoxContainer } from "@/components/layout/BoxContainer";

export function WorkspacesContent() {
  const { data: workspaces = [], isLoading, error } = useWorkspaces();
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(
    null,
  );
  const [createOpen, setCreateOpen] = useState(false);

  if (selectedWorkspace) {
    return (
      <main className="h-full overflow-y-auto">
        <BoxContainer variant="page">
          <WorkspaceDetail
            workspace={selectedWorkspace}
            onBack={() => setSelectedWorkspace(null)}
            backLabel="Back to Workspaces"
          />
        </BoxContainer>
      </main>
    );
  }

  let content;
  if (isLoading) {
    content = <LoadingState title="Loading workspaces" />;
  } else if (error) {
    content = <ErrorState message="Failed to load workspaces" />;
  } else if (workspaces.length === 0) {
    content = (
      <EmptyState
        title="No workspaces yet"
        description="Create a workspace to keep its conversations organized."
        action={
          <Button onClick={() => setCreateOpen(true)}>New workspace</Button>
        }
      />
    );
  } else {
    content = (
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
        {workspaces.map((workspace) => (
          <WorkspaceCard
            key={workspace.id}
            workspace={workspace}
            compact
            onClick={() => setSelectedWorkspace(workspace)}
          />
        ))}
      </div>
    );
  }

  return (
    <main className="h-full overflow-y-auto">
      <BoxContainer variant="page">
        <div className="mb-7 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Workspaces
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              All workspaces, sorted by recent activity.
            </p>
          </div>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus data-icon="inline-start" />
            New workspace
          </Button>
        </div>
        {workspaces.length > 0 && (
          <p className="mb-3 text-xs text-muted-foreground">
            {workspaces.length}{" "}
            {workspaces.length === 1 ? "workspace" : "workspaces"}
          </p>
        )}
        {content}
      </BoxContainer>
      <WorkspaceDialog open={createOpen} onOpenChange={setCreateOpen} />
    </main>
  );
}
