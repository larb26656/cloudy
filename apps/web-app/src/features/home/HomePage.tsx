import { useState } from "react";
import { useTabStore } from "@/stores/tabStore";
import { MainTabBar } from "./components/MainTabBar";
import { TabHeaderBar } from "./components/TabHeaderBar";
import { ConnectionStatusBanner } from "./components/ConnectionStatusBanner";
import { HomeContent } from "./HomeContent";
import { ChatCreateDialog } from "./tabs/implementations/chat/ChatCreateDialog";
import { tabTypeMap } from "./tabs/template";
import { ErrorState } from "@repo/ui/components/error-state";
import { useGlobalEvent } from "@/providers";
import { AppSidebar } from "@/features/app/components";
import { AgentsContent, ProvidersContent, WorkspacesContent } from "./pages";
import { useHomeSectionStore } from "@/stores/homeSectionStore";

export default function HomePage() {
  const { status } = useGlobalEvent();
  const activeTabId = useTabStore((s) => s.activeTabId);
  const tabs = useTabStore((s) => s.tabs);
  const removeTab = useTabStore((s) => s.removeTab);
  const activeSection = useHomeSectionStore((s) => s.activeSection);
  const [projectChatOpen, setProjectChatOpen] = useState(false);

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-background">
      <MainTabBar />
      {(status === "PENDING" || status === "DISCONNECTED") && (
        <ConnectionStatusBanner />
      )}
      <TabHeaderBar />
      <div className="flex-1 overflow-hidden">
        <div className={activeTabId === "home" ? "flex h-full" : "hidden"}>
          <AppSidebar />
          <div className="min-w-0 flex-1">
            <div className={activeSection === "home" ? "h-full" : "hidden"}>
              <HomeContent
                onOpenProjectChat={() => {
                  setProjectChatOpen(true);
                }}
              />
            </div>
            {activeSection === "workspaces" && <WorkspacesContent />}
            {activeSection === "agents" && <AgentsContent />}
            {activeSection === "providers" && <ProvidersContent />}
          </div>
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

      {/*
        Rendered outside the <Activity> boundaries above: its submit adds a
        tab (deactivating the home tree) in the same batch as this dialog's
        close. A portal'd dialog owned by a deactivated tree never commits
        its unmount, leaving a ghost popup stuck on screen.
      */}
      <ChatCreateDialog
        open={projectChatOpen}
        onOpenChange={setProjectChatOpen}
      />
    </div>
  );
}
