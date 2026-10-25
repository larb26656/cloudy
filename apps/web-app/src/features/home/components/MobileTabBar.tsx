import { Menu } from "lucide-react";
import { useTabStore } from "@/stores/tabStore";
import { AppBar } from "@/components/layout";
import { TabTitle, tabTypeMap } from "../tabs/template";
import { NotificationBell } from "@/components/notification";
import { appPages } from "@/features/app/components/AppPageContent";
import { useHomeSectionStore } from "@/stores/homeSectionStore";

interface MobileTabBarProps {
  onOpenDrawer: () => void;
}

export function MobileTabBar({ onOpenDrawer }: MobileTabBarProps) {
  const tabs = useTabStore((s) => s.tabs);
  const activeTabId = useTabStore((s) => s.activeTabId);
  const activeSection = useHomeSectionStore((s) => s.activeSection);
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
        {activeTab &&
        tabTypeMap[activeTab.type]?.hideMobileAppBarTitle ? null : activeTab ? (
          <TabTitle tab={activeTab} />
        ) : activeSection === "home" ? (
          "Home"
        ) : (
          appPages[activeSection].label
        )}
      </AppBar.Title>
      <AppBar.Actions>
        {isHome ? <NotificationBell /> : null}
        {activeTab && <>{Actions && <Actions tab={activeTab} />}</>}
      </AppBar.Actions>
    </AppBar>
  );
}
