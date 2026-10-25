import { ArrowRight } from "lucide-react";
import { useWorkspaces } from "@/hooks/queries";
import { LoadingState } from "@repo/ui/components/loading-state";
import { ErrorState } from "@repo/ui/components/error-state";
import { EmptyState } from "@repo/ui/components/empty-state";
import { Button } from "@repo/ui/components/button";
import type { Workspace } from "@/lib/cloudy/workspaces";
import { useHomeSectionStore } from "@/stores/homeSectionStore";
import { WorkspaceCard } from "./WorkspaceCard";

interface WorkspacesSectionProps {
  onSelectWorkspace: (workspace: Workspace) => void;
  compact?: boolean;
}

export function WorkspacesSection({
  onSelectWorkspace,
  compact = false,
}: WorkspacesSectionProps) {
  const { data: workspaces = [], isLoading, error } = useWorkspaces();
  const setActiveSection = useHomeSectionStore((s) => s.setActiveSection);
  const displayedWorkspaces = workspaces.slice(0, 6);

  return (
    <section className="mb-9">
      <div className="mb-3.5 flex items-center justify-between">
        <h2 className="text-sm font-bold">
          {compact ? "Your workspaces" : "Recent workspaces"}
        </h2>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1 px-2 text-xs text-muted-foreground"
            onClick={() => setActiveSection("workspaces")}
          >
            {compact ? "View all" : "View more"}
            <ArrowRight data-icon="inline-end" />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <LoadingState size="inline" title="Loading workspaces" />
      ) : error ? (
        <ErrorState size="inline" bare message="Failed to load workspaces" />
      ) : workspaces.length === 0 ? (
        <EmptyState size="inline" title="No workspaces yet" />
      ) : (
        <div
          className={
            compact
              ? "flex flex-col gap-2"
              : "grid grid-cols-1 gap-3 md:grid-cols-2"
          }
        >
          {displayedWorkspaces.map((w) => (
            <WorkspaceCard
              key={w.id}
              workspace={w}
              compact={compact}
              onClick={() => onSelectWorkspace(w)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
