import type { ConfigDialogProps } from "../../template";
import { TerminalWorkspaceDialog } from "@/components/terminal";

export function TerminalNodeConfigDialog({
  open,
  onOpenChange,
  onSubmit,
}: ConfigDialogProps) {
  return (
    <TerminalWorkspaceDialog
      open={open}
      onOpenChange={onOpenChange}
      onSubmit={(workspace) =>
        onSubmit({ workspaceId: workspace.id, ptyId: null })
      }
    />
  );
}
