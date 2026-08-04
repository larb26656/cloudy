import { useNavigate } from "@tanstack/react-router";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { WorkspaceSelectStep } from "@/features/workspace/WorkspaceSelectStep";
import { useTabStore } from "@/stores/tabStore";
import type { CreateDialogProps } from "../../template";

export function FilesCreateDialog({ open, onOpenChange }: CreateDialogProps) {
  const navigate = useNavigate();
  const addTab = useTabStore((s) => s.addTab);

  const handleClose = () => onOpenChange(false);

  const handleGoToWorkspaces = () => {
    handleClose();
    navigate({ to: "/" });
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md max-h-[85vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>Select Workspace</DialogTitle>
          <DialogDescription>
            Choose a workspace to view its changed files
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 flex-1 min-h-0 flex flex-col">
          <WorkspaceSelectStep
            onSelect={(workspace) => {
              addTab("files", {
                workspaceId: workspace.id,
                directory: workspace.directory,
              });
              handleClose();
            }}
            onGoToWorkspaces={handleGoToWorkspaces}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
