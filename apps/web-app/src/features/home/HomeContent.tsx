import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { FolderOpen, Plus, Settings } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog";
import { WorkspaceDialog } from "@/features/workspace/WorkspaceDialog";
import { WorkspaceItem } from "./components/WorkspaceItem";
import { SessionList } from "./components/SessionList";
import { Separator } from "@/components/ui/separator";
import { LoadingState } from "@/components/ui/loading-state";
import { useWorkspaces, useDeleteWorkspace } from "@/hooks/queries";
import { useSelectedWorkspaceStore } from "@/stores/selectedWorkspaceStore";
import type { Workspace } from "@/lib/cloudy/workspaces";

export function HomeContent() {
  const { data: workspaces = [], isLoading } = useWorkspaces();
  const deleteWorkspace = useDeleteWorkspace();
  const selectedWorkspaceId = useSelectedWorkspaceStore(
    (s) => s.selectedWorkspaceId,
  );
  const selectWorkspace = useSelectedWorkspaceStore((s) => s.selectWorkspace);

  const [workspaceDialogOpen, setWorkspaceDialogOpen] = useState(false);
  const [editingWorkspace, setEditingWorkspace] = useState<Workspace | null>(
    null,
  );
  const [deletingWorkspace, setDeletingWorkspace] = useState<Workspace | null>(
    null,
  );

  const selectedWorkspace = workspaces.find((w) => w.id === selectedWorkspaceId);

  return (
    <div className="flex flex-1 flex-col md:flex-row h-full overflow-hidden">
      <section className="flex w-full h-60 md:w-64 md:h-full shrink-0 flex-col gap-2 border-b md:border-r p-4">
        <div className="flex shrink-0 items-center justify-between">
          <h2 className="text-sm font-semibold text-muted-foreground">
            Workspaces
          </h2>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => {
              setEditingWorkspace(null);
              setWorkspaceDialogOpen(true);
            }}
          >
            <Plus data-icon="inline-start" />
          </Button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto -mr-4 pr-4">
          {isLoading ? (
            <LoadingState title="Loading workspaces" />
          ) : workspaces.length === 0 ? (
            <EmptyState icon={Plus} title="No workspaces" />
          ) : (
            workspaces.map((w) => (
              <WorkspaceItem
                key={w.id}
                workspace={w}
                selected={selectedWorkspaceId === w.id}
                onSelect={(id) => selectWorkspace(id)}
                onEdit={(workspace) => {
                  setEditingWorkspace(workspace);
                  setWorkspaceDialogOpen(true);
                }}
                onDelete={setDeletingWorkspace}
              />
            ))
          )}
        </div>

        <Separator className="my-2" />

        <Link to="/settings" className="shrink-0">
          <Button variant="ghost" className="w-full justify-start gap-2 px-2">
            <Settings className="size-4" />
            <span className="text-sm">Settings</span>
          </Button>
        </Link>
      </section>

      <section className="flex h-full min-h-0 min-w-0 flex-1 flex-col gap-2 p-4 overflow-hidden">
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

      <WorkspaceDialog
        open={workspaceDialogOpen}
        onOpenChange={(open) => {
          setWorkspaceDialogOpen(open);
          if (!open) {
            setEditingWorkspace(null);
          }
        }}
        workspace={editingWorkspace}
      />

      <DeleteConfirmDialog
        item={
          deletingWorkspace
            ? { id: deletingWorkspace.id, name: deletingWorkspace.name }
            : null
        }
        onConfirm={() => {
          if (deletingWorkspace) {
            deleteWorkspace.mutate(deletingWorkspace.id, {
              onSuccess: () => setDeletingWorkspace(null),
            });
          }
        }}
        onCancel={() => setDeletingWorkspace(null)}
      />
    </div>
  );
}
