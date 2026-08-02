import { useNavigate } from "@tanstack/react-router";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { WorkspaceSelectStep } from "@/features/workspace/WorkspaceSelectStep";
import type { Workspace } from "@/lib/cloudy/workspaces";

interface TerminalWorkspaceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (workspace: Workspace) => void;
}

/**
 * Shared "pick a workspace" step used by both the terminal tab and the
 * terminal desk node. The selected workspace's `directory` becomes the PTY
 * `cwd`. Adapters (tab/node) translate the callback into their own store
 * shapes.
 */
export function TerminalWorkspaceDialog({
  open,
  onOpenChange,
  onSubmit,
}: TerminalWorkspaceDialogProps) {
  const navigate = useNavigate();

  const handleClose = () => onOpenChange(false);

  const handleSelect = (workspace: Workspace) => {
    onSubmit(workspace);
    handleClose();
  };

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
            Choose a workspace to start the terminal in
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 flex-1 min-h-0 flex flex-col">
          <WorkspaceSelectStep
            onSelect={handleSelect}
            onGoToWorkspaces={handleGoToWorkspaces}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
