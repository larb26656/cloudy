import type { ReactNode } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useWorkspace } from "@/hooks/queries";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";
import { WorkspaceDetail } from "@/features/home/components/WorkspaceDetail";

function WorkspacePage() {
  const { workspaceId } = Route.useParams();
  const navigate = useNavigate();
  const { data: workspace, isLoading, error } = useWorkspace(workspaceId);

  let content: ReactNode;
  if (isLoading) {
    content = <LoadingState title="Loading workspace..." />;
  } else if (error || !workspace) {
    content = (
      <ErrorState
        title="Workspace not found"
        message={error?.message}
        onRetry={() => navigate({ to: "/" })}
        retryLabel="Back to Home"
      />
    );
  } else {
    content = (
      <div className="mx-auto w-full max-w-3xl px-6 py-10">
        <WorkspaceDetail
          workspace={workspace}
          onBack={() => navigate({ to: "/" })}
        />
      </div>
    );
  }

  return <div className="h-full overflow-y-auto">{content}</div>;
}

export const Route = createFileRoute("/workspace/$workspaceId")({
  component: WorkspacePage,
});
