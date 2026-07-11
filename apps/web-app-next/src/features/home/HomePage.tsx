import { useTabStore } from "@/stores/tabStore";
import { MainTabBar } from "./components/MainTabBar";
import { ChatContent } from "./ChatContent";
import { HomeContent } from "./HomeContent";

export default function HomePage() {
  const { activeTabId } = useTabStore();
  return (
    <div className="flex flex-col h-dvh w-full overflow-hidden bg-background">
      <MainTabBar />
      <div className="flex-1">
        {activeTabId === "home" ? <HomeContent /> : <ChatContent />}
      </div>
    </div>
  );
}
