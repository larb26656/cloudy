import { FileDiff } from "lucide-react";
import type { Tab } from "@/stores/tabStore";
import { TabItemShell } from "@/features/home/components/TabItemShell";

interface FilesTabItemProps {
  tab: Extract<Tab, { type: "files" }>;
  isActive: boolean;
  onClick: () => void;
  onClose: () => void;
}

export function FilesTabItem({
  tab,
  isActive,
  onClick,
  onClose,
}: FilesTabItemProps) {
  return (
    <TabItemShell
      icon={FileDiff}
      label="Changed Files"
      workspaceId={tab.data.workspaceId}
      isActive={isActive}
      onClick={onClick}
      onClose={onClose}
    />
  );
}
