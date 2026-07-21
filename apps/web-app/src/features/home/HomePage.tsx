import type { ReactNode } from "react";
import { useTabStore } from "@/stores/tabStore";
import { MainTabBar } from "./components/MainTabBar";
import { HomeContent } from "./HomeContent";
import { tabTypeMap } from "./tabs/template";
import { ErrorState } from "@/components/ui/error-state";

export default function HomePage() {
  const activeTabId = useTabStore((s) => s.activeTabId);
  const tabs = useTabStore((s) => s.tabs);
  const removeTab = useTabStore((s) => s.removeTab);

  let content: ReactNode;

  if (activeTabId === "home") {
    content = <HomeContent />;
  } else {
    const currentTab = tabs.find((t) => t.id === activeTabId);

    if (!currentTab) {
      content = (
        <ErrorState
          message="Tab not found."
          onRetry={() => removeTab(activeTabId)}
        />
      );
    } else {
      const template = tabTypeMap[currentTab.type];
      if (!template) {
        content = (
          <ErrorState
            message={`Unknown tab type: "${currentTab.type}". Please close this tab.`}
            onRetry={() => removeTab(currentTab.id)}
          />
        );
      } else {
        const Content = template.ContentComponent;
        content = <Content tab={currentTab} />;
      }
    }
  }

  return (
    <div className="flex flex-col h-dvh w-full overflow-hidden bg-background">
      <MainTabBar />
      <div className="flex-1 overflow-hidden">{content}</div>
    </div>
  );
}
