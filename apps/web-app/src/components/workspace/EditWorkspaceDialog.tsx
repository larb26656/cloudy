import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { type WorkspaceColor } from "@/stores/workspaceStore";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { WorkspaceForm } from "./WorkspaceForm";
import {
  workspaceSchema,
  type WorkspaceFormData,
} from "./workspaceSchema";

interface EditWorkspaceDialogProps {
  workspace: {
    id: string;
    instanceId: string;
    name: string;
    directory: string;
    color: WorkspaceColor;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditWorkspaceDialog({
  workspace,
  open,
  onOpenChange,
}: EditWorkspaceDialogProps) {
  const workspaceStore = useWorkspaceStore();

  const form = useForm<WorkspaceFormData>({
    resolver: zodResolver(workspaceSchema),
    defaultValues: {
      instanceId: workspace.instanceId,
      name: workspace.name,
      directory: workspace.directory,
      color: workspace.color,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        instanceId: workspace.instanceId,
        name: workspace.name,
        directory: workspace.directory,
        color: workspace.color,
      });
    }
  }, [open, workspace, form]);

  const handleSubmit = (data: WorkspaceFormData) => {
    workspaceStore.updateWorkspace(workspace.id, {
      name: data.name,
      color: data.color as WorkspaceColor,
      directory: data.directory,
      instanceId: data.instanceId,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Workspace</DialogTitle>
          <DialogDescription>
            Update your workspace settings and directory.
          </DialogDescription>
        </DialogHeader>
        <WorkspaceForm
          defaultValues={form.getValues()}
          onSubmit={handleSubmit}
          submitLabel="Save"
          isSubmitting={form.formState.isSubmitting}
        />
      </DialogContent>
    </Dialog>
  );
}
