import { Menu, X } from "lucide-react";
import { useTabStore } from "@/stores/tabStore";
import { AppBar } from "@/components/layout";
import { TabTitle, tabTypeMap } from "../tabs/template";

interface MobileTabBarProps {
  onOpenDrawer: () => void;
}

export function MobileTabBar({ onOpenDrawer }: MobileTabBarProps) {
  const tabs = useTabStore((s) => s.tabs);
  const activeTabId = useTabStore((s) => s.activeTabId);
  const removeTab = useTabStore((s) => s.removeTab);

  const activeTab =
    activeTabId && activeTabId !== "home"
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
      {activeTab && (
        <AppBar.Actions>
          {Actions && <Actions tab={activeTab} />}
          <AppBar.ActionIcon
            icon={X}
            label="Close tab"
            onClick={() => removeTab(activeTab.id)}
          />
        </AppBar.Actions>
      )}
    </AppBar>
  );
}
