import type { CreateDialogProps } from "../../template";
import { useTabStore } from "@/stores/tabStore";
import { TerminalWorkspaceDialog } from "@/components/terminal";

export function TerminalCreateDialog({
  open,
  onOpenChange,
}: CreateDialogProps) {
  const addTab = useTabStore((s) => s.addTab);

  return (
    <TerminalWorkspaceDialog
      open={open}
      onOpenChange={onOpenChange}
      onSubmit={(workspace) =>
        addTab("terminal", {
          workspaceId: workspace.id,
          directory: workspace.directory,
          ptyId: null,
        })
      }
    />
  );
}
