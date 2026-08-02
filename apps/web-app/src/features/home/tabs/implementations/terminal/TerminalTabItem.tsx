import { SquareTerminal } from "lucide-react";
import type { Tab } from "@/features/home/tabs/template";
import { TabItemShell } from "@/features/home/components/TabItemShell";
import { useWorkspaceStore } from "@/stores/workspaceStore";

interface TerminalTabItemProps {
  tab: Extract<Tab, { type: "terminal" }>;
  isActive: boolean;
  onClick: () => void;
  onClose: () => void;
}

export function TerminalTabItem({
  tab,
  isActive,
  onClick,
  onClose,
}: TerminalTabItemProps) {
  const workspace = useWorkspaceStore((s) =>
    s.getWorkspace(tab.data.workspaceId),
  );
  const displayName = workspace ? `Terminal · ${workspace.name}` : "Terminal";

  return (
    <TabItemShell
      icon={SquareTerminal}
      label={displayName}
      workspaceId={tab.data.workspaceId}
      isActive={isActive}
      onClick={onClick}
      onClose={onClose}
    />
  );
}

export type { TerminalData } from "./meta";
