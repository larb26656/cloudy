import { Terminal } from "lucide-react";
import type { Tab } from "@/features/home/tabs/template";
import { TabItemShell } from "@/features/home/components/TabItemShell";
import { useWorkspace } from "@/hooks/queries";

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
  const { data: workspace } = useWorkspace(tab.data.workspaceId);
  const label = workspace?.name ?? "Terminal";

  return (
    <TabItemShell
      icon={Terminal}
      label={label}
      workspaceId={tab.data.workspaceId}
      isActive={isActive}
      onClick={onClick}
      onClose={onClose}
    />
  );
}

export type { TerminalData } from "./meta";
