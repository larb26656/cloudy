import { useTabStore } from "@/stores/tabStore";
import { MainTabBar } from "./components/MainTabBar";
import { HomeContent } from "./HomeContent";
import { tabTypeMap } from "./tabs/template";
import { ErrorState } from "@/components/ui/error-state";
import { useGlobalEvent } from "@/providers";
import { ErrorConnectionNotify } from "./components/ErrorConnectionNotify";

export default function HomePage() {
  const { status } = useGlobalEvent();
  const activeTabId = useTabStore((s) => s.activeTabId);
  const tabs = useTabStore((s) => s.tabs);
  const removeTab = useTabStore((s) => s.removeTab);

  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-background">
      <MainTabBar />
      {status === "DISCONNECTED" && <ErrorConnectionNotify />}
      <div className="flex-1 overflow-hidden">
        <div className={activeTabId === "home" ? "h-full" : "hidden"}>
          <HomeContent />
        </div>
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
          return (
            <div key={tab.id} className={isActive ? "h-full" : "hidden"}>
              <Content tab={tab} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
