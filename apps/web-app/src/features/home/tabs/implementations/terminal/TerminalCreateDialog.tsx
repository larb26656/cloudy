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
        addTab("terminal", { ptyId: null, workspaceId: workspace.id })
      }
    />
  );
}
