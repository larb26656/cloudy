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
      onSubmit={(data) => addTab("terminal", data)}
    />
  );
}
