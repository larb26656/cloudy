import { TabTitle, tabTypeMap, type TabBarProps } from "../tabs/template";
import { ProviderIcon } from "@/components/provider/ProviderIcon";
import { TabItemShell } from "./TabItemShell";

export function TabBarItem({ tab, isActive, onClick, onClose }: TabBarProps) {
  const template = tabTypeMap[tab.type];
  if (!template) return null;
  const Icon = template.icon;
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
    />
  );
}
