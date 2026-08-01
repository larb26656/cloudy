import { Palette } from "lucide-react";
import type { Tab } from "@/stores/tabStore";
import { TabItemShell } from "@/features/home/components/TabItemShell";

interface DeskTabItemProps {
  tab: Extract<Tab, { type: "desk" }>;
  isActive: boolean;
  onClick: () => void;
  onClose: () => void;
}

export function DeskTabItem({
  tab,
  isActive,
  onClick,
  onClose,
}: DeskTabItemProps) {
  return (
    <TabItemShell
      icon={Palette}
      label={tab.data.name}
      isActive={isActive}
      onClick={onClick}
      onClose={onClose}
    />
  );
}
