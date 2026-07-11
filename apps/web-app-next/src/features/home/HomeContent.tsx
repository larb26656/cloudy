import { Button } from "@/components/ui/button";
import { FolderOpen, Plus } from "lucide-react";
import { WorkspaceItem } from "./components/WorkspaceItem";
import { SessionList } from "./components/SessionList";
import { EmptyState } from "@/components/ui/empty-state";
import { useWorkspaceStore } from "@/stores/workspaceStore";

export function HomeContent() {
  const { workspaces, selectedWorkspaceId, selectWorkspace, getWorkspace } =
    useWorkspaceStore();

  const selectedWorkspace = selectedWorkspaceId
    ? getWorkspace(selectedWorkspaceId)
    : undefined;

  return (
    <div className="flex flex-1 flex-col md:flex-row h-full">
      <section className="flex w-full h-60 md:w-64 md:h-full shrink-0 flex-col gap-2 border-b md:border-r p-4">
        <div className="flex shrink-0 items-center justify-between">
          <h2 className="text-sm font-semibold text-muted-foreground">
            Workspaces
          </h2>
          <Button variant="ghost" size="icon-xs">
            <Plus data-icon="inline-start" />
          </Button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto -mr-4 pr-4">
          {workspaces.map((w) => (
            <WorkspaceItem
              key={w.id}
              workspace={w}
              selected={selectedWorkspaceId === w.id}
              onSelect={selectWorkspace}
              onEdit={() => {}}
              onDelete={() => {}}
            />
          ))}
          {workspaces.length === 0 && (
            <EmptyState icon={Plus} title="No workspaces" />
          )}
        </div>
      </section>

      <section className="flex min-h-0 min-w-0 flex-1 flex-col gap-2 p-4">
        <h2 className="shrink-0 text-sm font-semibold text-muted-foreground">
          Sessions
        </h2>
        {selectedWorkspace ? (
          <SessionList
            directory={selectedWorkspace.directory}
            workspaceId={selectedWorkspace.id}
          />
        ) : (
          <EmptyState icon={FolderOpen} title="Select a workspace" />
        )}
      </section>
    </div>
  );
}
