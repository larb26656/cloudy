import { Menu } from "lucide-react";
import { useTabStore } from "@/stores/tabStore";
import { Button } from "@/components/ui/button";
import { TabTitle, tabTypeMap } from "../tabs/template";

interface MobileTabBarProps {
  onOpenDrawer: () => void;
}

export function MobileTabBar({ onOpenDrawer }: MobileTabBarProps) {
  const tabs = useTabStore((s) => s.tabs);
  const activeTabId = useTabStore((s) => s.activeTabId);

  const activeTab =
    activeTabId && activeTabId !== "home"
      ? (tabs.find((t) => t.id === activeTabId) ?? null)
      : null;

  const Actions = activeTab
    ? tabTypeMap[activeTab.type]?.HeaderActionsComponent
    : null;

  return (
    <div className="flex h-14 items-center border-b md:hidden">
      <Button
        variant="ghost"
        size="icon-lg"
        onClick={onOpenDrawer}
        aria-label="Open tabs"
        className="h-full aspect-auto text-muted-foreground hover:text-foreground"
      >
        <Menu size={24} />
      </Button>
      <div className="flex h-full flex-1 items-center gap-2.5 px-4 text-left">
        <span className="truncate text-base font-semibold">
          {activeTab ? <TabTitle tab={activeTab} /> : "Home"}
        </span>
      </div>
      {activeTab && Actions && (
        <div className="flex h-full items-center pr-3">
          <Actions tab={activeTab} />
        </div>
      )}
    </div>
  );
}
