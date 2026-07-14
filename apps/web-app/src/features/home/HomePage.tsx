import { useTabStore } from "@/stores/tabStore";
import { MainTabBar } from "./components/MainTabBar";
import { ChatContent } from "./ChatContent";
import { HomeContent } from "./HomeContent";
import { DeskContent } from "./DeskContent";
import { WebviewContent } from "./WebviewContent";

export default function HomePage() {
  const activeTabId = useTabStore((s) => s.activeTabId);
  const tabs = useTabStore((s) => s.tabs);

  const renderDynamicTab = () => {
    if (!activeTabId) {
      return;
    }

    const currentTab = tabs.find((t) => t.id === activeTabId);

    if (!currentTab) return;

    if (currentTab.type === "session") {
      return <ChatContent tab={currentTab} />;
    }

    if (currentTab.type === "desk") {
      return <DeskContent />;
    }

    if (currentTab.type === "webview") {
      return <WebviewContent tab={currentTab} />;
    }
  };

  return (
    <div className="flex flex-col h-dvh w-full overflow-hidden bg-background">
      <MainTabBar />
      <div className="flex-1 overflow-hidden">
        {activeTabId === "home" ? <HomeContent /> : renderDynamicTab()}
      </div>
    </div>
  );
}
