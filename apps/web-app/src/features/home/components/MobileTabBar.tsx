import { Menu } from "lucide-react";
import { useTabStore } from "@/stores/tabStore";
import { AppBar } from "@/components/layout";
import { TabTitle, tabTypeMap } from "../tabs/template";
import { NotificationBell } from "@/components/notification";

interface MobileTabBarProps {
  onOpenDrawer: () => void;
}

export function MobileTabBar({ onOpenDrawer }: MobileTabBarProps) {
  const tabs = useTabStore((s) => s.tabs);
  const activeTabId = useTabStore((s) => s.activeTabId);
  const isHome = activeTabId === "home";

  const activeTab =
    activeTabId && !isHome
      ? (tabs.find((t) => t.id === activeTabId) ?? null)
      : null;

  const Actions = activeTab
    ? tabTypeMap[activeTab.type]?.HeaderActionsComponent
    : null;

  return (
    <AppBar className="md:hidden">
      <AppBar.Leading>
        <AppBar.ActionIcon
          icon={Menu}
          label="Open tabs"
          onClick={onOpenDrawer}
        />
      </AppBar.Leading>
      <AppBar.Title>
        {activeTab ? <TabTitle tab={activeTab} /> : "Home"}
      </AppBar.Title>
      <AppBar.Actions>
        {isHome ? <NotificationBell /> : null}
        {activeTab && <>{Actions && <Actions tab={activeTab} />}</>}
      </AppBar.Actions>
    </AppBar>
  );
}
