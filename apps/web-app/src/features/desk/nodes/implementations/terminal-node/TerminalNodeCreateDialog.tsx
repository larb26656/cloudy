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
      onSubmit={(data) => onSubmit({ ...data })}
    />
  );
}
