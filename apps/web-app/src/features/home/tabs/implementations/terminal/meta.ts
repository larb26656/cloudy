import { SquareTerminal } from "lucide-react";
import type { TabTemplate } from "../../template";
import { getOcClient } from "@/lib/opencode";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { TerminalContent } from "./TerminalContent";
import { TerminalCreateDialog } from "./TerminalCreateDialog";
import { TerminalTabItem } from "./TerminalTabItem";

export type TerminalData = {
  ptyId: string | null;
  workspaceId: string;
};

export const terminalTemplate: TabTemplate<TerminalData> = {
  type: "terminal",
  label: "New Terminal",
  icon: SquareTerminal,
  TabBarComponent: TerminalTabItem,
  ContentComponent: TerminalContent,
  CreateDialog: TerminalCreateDialog,
  onClose: (tab) => {
    if (tab.type !== "terminal") return;
    const workspace = useWorkspaceStore.getState().getWorkspace(
      tab.data.workspaceId,
    );
    const directory = workspace?.directory ?? "";
    void disposePty(tab.data.ptyId, directory);
  },
};

/**
 * Kill a PTY session. Best-effort: errors are swallowed because the tab/node
 * is already being torn down. Kept as a free helper so the node template can
 * reuse it.
 */
export async function disposePty(
  ptyId: string | null,
  directory: string,
): Promise<void> {
  if (!ptyId) return;
  const oc = getOcClient();
  await oc.pty.remove({ ptyID: ptyId, directory }).catch(() => {});
}

