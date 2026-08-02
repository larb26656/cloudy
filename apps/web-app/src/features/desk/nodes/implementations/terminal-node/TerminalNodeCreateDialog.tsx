import type { ConfigDialogProps } from "../../template";
import { TerminalWorkspaceDialog } from "@/components/terminal";

export function TerminalNodeCreateDialog({
  open,
  onOpenChange,
  onSubmit,
}: ConfigDialogProps) {
  return (
    <TerminalWorkspaceDialog
      open={open}
      onOpenChange={onOpenChange}
      onSubmit={(workspace) =>
        onSubmit({
          workspaceId: workspace.id,
          directory: workspace.directory,
          ptyId: null,
        })
      }
    />
  );
}
