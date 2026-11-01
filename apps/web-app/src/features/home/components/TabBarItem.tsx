import {
  TabIndicator,
  TabTitle,
  tabTypeMap,
  type TabBarProps,
} from "../tabs/template";
import { ProviderIcon } from "@/components/provider/ProviderIcon";
import { TabItemShell } from "./TabItemShell";

export function TabBarItem({
  tab,
  isActive,
  onClick,
  onClose,
  onDuplicate,
}: TabBarProps) {
  const template = tabTypeMap[tab.type];
  if (!template) return null;
  const Icon = template.icon;
  const closeControl = template.IndicatorComponent ? (
    <TabIndicator tab={tab} onClose={onClose} />
  ) : undefined;
  const icon =
    tab.type === "chat" ? (
      <ProviderIcon providerId={tab.data.providerId} />
    ) : (
      <Icon />
    );

  return (
    <TabItemShell
      icon={icon}
      label={<TabTitle tab={tab} />}
      isActive={isActive}
      onClick={onClick}
      onClose={onClose}
      onDuplicate={onDuplicate}
      closeControl={closeControl}
    />
  );
}
