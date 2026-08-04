import { Plus } from "lucide-react";
import { useState } from "react";
import { useWorkspaces } from "@/hooks/queries";
import { WorkspaceDialog } from "@/features/workspace/WorkspaceDialog";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import type { Workspace } from "@/lib/cloudy/workspaces";
import { WorkspaceCard } from "./WorkspaceCard";

interface WorkspacesSectionProps {
  onSelectWorkspace: (workspace: Workspace) => void;
}

export function WorkspacesSection({
  onSelectWorkspace,
}: WorkspacesSectionProps) {
  const { data: workspaces = [], isLoading, error } = useWorkspaces();
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <section className="mb-9">
      <div className="mb-3.5 flex items-center justify-between">
        <h2 className="text-sm font-bold">Workspaces</h2>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1 px-2 text-xs text-muted-foreground"
          onClick={() => setCreateOpen(true)}
        >
          <Plus data-icon="inline-start" />
          New
        </Button>
      </div>

      {isLoading ? (
        <LoadingState size="inline" title="Loading workspaces" />
      ) : error ? (
        <ErrorState size="inline" bare message="Failed to load workspaces" />
      ) : workspaces.length === 0 ? (
        <EmptyState size="inline" title="No workspaces yet" />
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {workspaces.map((w) => (
            <WorkspaceCard
              key={w.id}
              workspace={w}
              onClick={() => onSelectWorkspace(w)}
            />
          ))}
        </div>
      )}

      <WorkspaceDialog open={createOpen} onOpenChange={setCreateOpen} />
    </section>
  );
}
