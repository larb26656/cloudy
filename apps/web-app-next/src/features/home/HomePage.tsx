import { useTabStore } from "@/stores/tabStore";
import { MainTabBar } from "./components/MainTabBar";
import { ChatContent } from "./ChatContent";
import { HomeContent } from "./HomeContent";

export default function HomePage() {
  const activeTabId = useTabStore(s => s.activeTabId);
  const getTab = useTabStore(s => s.getTab);

  const renderDynamicTab = () => {
    if (!activeTabId) {
      return;
    }

    const currentTab = getTab(activeTabId);

    if (currentTab.type === 'session') {
      return <ChatContent sessionId={currentTab.data.sessionId} />
    }
  }

  return (
    <div className="flex flex-col h-dvh w-full overflow-hidden bg-background">
      <MainTabBar />
      <div className="flex-1">
        {activeTabId === "home" ? <HomeContent /> :
          renderDynamicTab()
        }
      </div>
    </div>
  );
}
