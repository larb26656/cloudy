import { Activity } from "react";
import { useTabStore } from "@/stores/tabStore";
import { MainTabBar } from "./components/MainTabBar";
import { TabHeaderBar } from "./components/TabHeaderBar";
import { ConnectionStatusBanner } from "./components/ConnectionStatusBanner";
import { HomeContent } from "./HomeContent";
import { tabTypeMap } from "./tabs/template";
import { ErrorState } from "@repo/ui/components/error-state";
import { useGlobalEvent } from "@/providers";

export default function HomePage() {
  const { status } = useGlobalEvent();
  const activeTabId = useTabStore((s) => s.activeTabId);
  const tabs = useTabStore((s) => s.tabs);
  const removeTab = useTabStore((s) => s.removeTab);

  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-background">
      <MainTabBar />
      {(status === "PENDING" || status === "DISCONNECTED") && (
        <ConnectionStatusBanner />
      )}
      <TabHeaderBar />
      <div className="flex-1 overflow-hidden">
        {/* Toggle `mode` only — conditionally rendering <Activity> would
            destroy the preserved state. */}
        <Activity mode={activeTabId === "home" ? "visible" : "hidden"}>
          <div className="h-full">
            <HomeContent />
          </div>
        </Activity>
        {tabs.map((tab) => {
          const isActive = activeTabId === tab.id;
          const template = tabTypeMap[tab.type];

          if (!template) {
            return (
              <div key={tab.id} className={isActive ? "h-full" : "hidden"}>
                <ErrorState
                  message={`Unknown tab type: "${tab.type}". Please close this tab.`}
                  onRetry={() => removeTab(tab.id)}
                />
              </div>
            );
          }

          const Content = template.ContentComponent;
          if (template.keepAliveWhenHidden) {
            return (
              <div key={tab.id} className={isActive ? "h-full" : "hidden"}>
                <Content tab={tab} />
              </div>
            );
          }
          return (
            <Activity key={tab.id} mode={isActive ? "visible" : "hidden"}>
              <div className="h-full">
                <Content tab={tab} />
              </div>
            </Activity>
          );
        })}
      </div>
    </div>
  );
}
