import { useEffect, useState, useRef } from "react";
import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldDescription,
  FieldError,
} from "@/components/ui/field";
import { ColorPicker } from "@/components/ui/color-picker/ColorPicker";
import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog";
import { toast } from "@/components/ui/sonner";
import {
  WORKSPACE_COLORS,
  useWorkspaceStore,
  type Workspace,
} from "@/stores/workspaceStore";

interface WorkspaceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspace?: Workspace | null;
}

export function WorkspaceDialog({
  open,
  onOpenChange,
  workspace,
}: WorkspaceDialogProps) {
  const isEditMode = !!workspace;
  const createWorkspace = useWorkspaceStore((s) => s.createWorkspace);
  const updateWorkspace = useWorkspaceStore((s) => s.updateWorkspace);
  const deleteWorkspace = useWorkspaceStore((s) => s.deleteWorkspace);
  const getWorkspaceByDirectory = useWorkspaceStore(
    (s) => s.getWorkspaceByDirectory,
  );
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const dirRef = useRef<string>("");

  const workspaceSchema = z.object({
    name: z.string().trim().min(1, "Name is required"),
    directory: z
      .string()
      .trim()
      .min(1, "Directory is required")
      .refine(
        (value) => {
          if (!value.trim()) return true;
          const existing = getWorkspaceByDirectory(value);
          return !existing || existing.id === workspace?.id;
        },
        { message: "Directory is already used" },
      ),
    color: z.enum(WORKSPACE_COLORS),
  });

  type WorkspaceFormValues = {
    name: string;
    directory: string;
    color: (typeof WORKSPACE_COLORS)[number];
  };

  const {
    control,
    handleSubmit,
    reset,
    trigger,
    formState: { errors },
  } = useForm<WorkspaceFormValues>({
    resolver: zodResolver(workspaceSchema),
    defaultValues: {
      name: "",
      directory: "",
      color: WORKSPACE_COLORS[0],
    },
  });

  const watchedDirectory = useWatch({ control, name: "directory" });

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (watchedDirectory !== dirRef.current && watchedDirectory.trim()) {
        dirRef.current = watchedDirectory;
        trigger("directory");
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [watchedDirectory, trigger]);

  useEffect(() => {
    if (open) {
      if (workspace) {
        reset({
          name: workspace.name,
          directory: workspace.directory,
          color: workspace.color,
        });
        dirRef.current = workspace.directory;
      } else {
        reset({
          name: "",
          directory: "",
          color: WORKSPACE_COLORS[0],
        });
        dirRef.current = "";
      }
    }
  }, [open, workspace, reset]);

  const onSubmit = (data: WorkspaceFormValues) => {
    if (isEditMode && workspace) {
      const result = updateWorkspace(workspace.id, {
        name: data.name,
        directory: data.directory,
        color: data.color,
      });

      if (result.success) {
        onOpenChange(false);
      } else {
        toast.error(result.error);
      }
    } else {
      const result = createWorkspace({
        name: data.name,
        directory: data.directory,
        color: data.color,
        instanceId: "default",
      });

      if (result.success) {
        onOpenChange(false);
      } else {
        toast.error(result.error);
      }
    }
  };

  const handleDelete = () => {
    if (!workspace) return;
    setDeleteTarget({ id: workspace.id, name: workspace.name });
  };

  const handleDeleteConfirm = () => {
    if (deleteTarget) {
      deleteWorkspace(deleteTarget.id);
      setDeleteTarget(null);
      onOpenChange(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isEditMode ? "Edit Workspace" : "Create Workspace"}
            </DialogTitle>
            <DialogDescription>
              {isEditMode
                ? "Update your workspace details."
                : "Add a new workspace to organize your sessions."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="workspace-name">Name</FieldLabel>
                <Input
                  id="workspace-name"
                  {...control.register("name")}
                  placeholder="My Workspace"
                />
                {errors.name && <FieldError>{errors.name.message}</FieldError>}
              </Field>

              <Field>
                <FieldLabel htmlFor="workspace-directory">Directory</FieldLabel>
                <Input
                  id="workspace-directory"
                  {...control.register("directory")}
                  placeholder="Workspace path"
                />
                <FieldDescription>
                  Used as folder name. Must be unique.
                </FieldDescription>
                {errors.directory && (
                  <FieldError>{errors.directory.message}</FieldError>
                )}
              </Field>

              <Field>
                <FieldLabel>Color</FieldLabel>
                <Controller
                  name="color"
                  control={control}
                  render={({ field }) => (
                    <ColorPicker
                      colors={WORKSPACE_COLORS}
                      value={field.value}
                      onChange={field.onChange}
                      columns={6}
                      size="md"
                    />
                  )}
                />
              </Field>
            </FieldGroup>

            <DialogFooter className="mt-6 gap-2">
              {isEditMode && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDelete}
                  className="mr-auto"
                >
                  Delete
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit">{isEditMode ? "Save" : "Create"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog
        item={deleteTarget}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}
