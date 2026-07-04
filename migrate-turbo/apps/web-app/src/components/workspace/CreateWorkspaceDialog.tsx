import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { WORKSPACE_COLORS, type WorkspaceColor } from "@/stores/workspaceStore";
import { useInstanceStore } from "@/stores/instanceStore";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { WorkspaceForm } from "./WorkspaceForm";
import type { WorkspaceFormData } from "./workspaceSchema";

interface CreateWorkspaceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateWorkspaceDialog({
  open,
  onOpenChange,
}: CreateWorkspaceDialogProps) {
  const { instances } = useInstanceStore();
  const workspaceStore = useWorkspaceStore();

  const defaultValues: WorkspaceFormData = {
    instanceId: instances[0]?.id ?? "",
    name: "",
    directory: "",
    color: WORKSPACE_COLORS[0] as WorkspaceColor,
  };

  const handleSubmit = (data: WorkspaceFormData) => {
    workspaceStore.createWorkspace(
      data.instanceId,
      {
        name: data.name,
        color: data.color as WorkspaceColor,
        directory: data.directory,
      },
      true,
    );
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Workspace</DialogTitle>
          <DialogDescription>
            Create a new workspace to organize your chats and memories.
          </DialogDescription>
        </DialogHeader>
        <WorkspaceForm
          defaultValues={defaultValues}
          onSubmit={handleSubmit}
          submitLabel="Create"
        />
      </DialogContent>
    </Dialog>
  );
}
