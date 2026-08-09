import {
  getTabWorkspaceId,
  TabTitle,
  tabTypeMap,
  type TabBarProps,
} from "../tabs/template";
import { TabItemShell } from "./TabItemShell";

export function TabBarItem({ tab, isActive, onClick, onClose }: TabBarProps) {
  const template = tabTypeMap[tab.type];
  if (!template) return null;

  return (
    <TabItemShell
      icon={template.icon}
      label={<TabTitle tab={tab} />}
      workspaceId={getTabWorkspaceId(tab)}
      isActive={isActive}
      onClick={onClick}
      onClose={onClose}
    />
  );
}
