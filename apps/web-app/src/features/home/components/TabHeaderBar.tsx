import { useTabStore } from "@/stores/tabStore";
import { tabTypeMap } from "../tabs/template";

export function TabHeaderBar() {
  const activeTabId = useTabStore((s) => s.activeTabId);
  const tabs = useTabStore((s) => s.tabs);

  if (!activeTabId || activeTabId === "home") return null;
  const tab = tabs.find((t) => t.id === activeTabId);
  if (!tab) return null;

  const template = tabTypeMap[tab.type];
  const Actions = template?.HeaderActionsComponent;
  if (!Actions) return null;

  return (
    <div className="hidden h-9 shrink-0 items-center justify-end border-b px-2 md:flex">
      <Actions tab={tab} />
    </div>
  );
}
