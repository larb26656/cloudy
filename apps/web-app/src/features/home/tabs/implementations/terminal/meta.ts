import { Terminal } from "lucide-react";
import type { TabTemplate } from "../../template";
import { cloudyClient } from "@/lib/api";
import { TerminalCreateDialog } from "./TerminalCreateDialog";
import { TerminalContent } from "./TerminalContent";
import { TerminalTabItem } from "./TerminalTabItem";

export type TerminalData = {
  workspaceId: string;
  directory: string;
  ptyId: string | null;
};

export const terminalTemplate: TabTemplate<TerminalData> = {
  type: "terminal",
  label: "New Terminal",
  icon: Terminal,
  TabBarComponent: TerminalTabItem,
  ContentComponent: TerminalContent,
  CreateDialog: TerminalCreateDialog,
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
