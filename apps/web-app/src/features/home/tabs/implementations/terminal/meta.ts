import { Terminal } from "lucide-react";
import type { TabTemplate, TabTitleProps } from "../../template";
import { useWorkspace } from "@/hooks/queries";
import { cloudyClient } from "@/lib/api";
import { TerminalCreateDialog } from "./TerminalCreateDialog";
import { TerminalContent } from "./TerminalContent";

export type TerminalData = {
  workspaceId: string;
  directory: string;
  ptyId: string | null;
};

function TerminalTabTitle({ data }: TabTitleProps<TerminalData>) {
  const { data: workspace } = useWorkspace(data.workspaceId);

  return workspace?.name ?? "Terminal";
}

export const terminalTemplate: TabTemplate<TerminalData> = {
  type: "terminal",
  label: "New Terminal",
  icon: Terminal,
  TitleComponent: TerminalTabTitle,
  ContentComponent: TerminalContent,
  CreateDialog: TerminalCreateDialog,
  getWorkspaceId: (data) => data.workspaceId,
  onClose: (tab) => {
    if (tab.type !== "terminal") return;
    const ptyId = tab.data.ptyId;
    if (ptyId) {
      void cloudyClient.api.pty.sessions[":id"]
        .$delete({ param: { id: ptyId } })
        .catch(() => {});
    }
  },
};
