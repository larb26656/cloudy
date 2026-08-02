import { ChatContainer } from "@/components/chat/ChatContainer";
import { ErrorState } from "@/components/ui/error-state";
import { TokenUsageIndicator } from "@/components/chat/TokenUsageIndicator";
import { Header } from "@/components/layout";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDeviceType } from "@/hooks";
import { useState } from "react";
import { useTheme } from "next-themes";
import { RefreshCw, Sun, Moon, PanelRight, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ModelSelector } from "@/components/chat/ModelSelector";
import { SidebarToggle } from "@/components/layout/SidebarToggle";
import { useSessionStore } from "@/stores/sessionStore";
import { useWorkspaceStore } from "@/stores/workspaceStore";

export default function ChatPage() {
  const { isMobile } = useDeviceType();
  const selectedSessionId = useSessionStore((s) => s.selectedSessionId);
  const selectedWorkspace = useWorkspaceStore((s) =>
    s.selectedWorkspaceId ? s.getWorkspace(s.selectedWorkspaceId) : undefined,
  );
  const [showMinimap, setShowMinimap] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();
  const isDarkMode = resolvedTheme === "dark";
  const toggleTheme = () => setTheme(isDarkMode ? "light" : "dark");

  if (!selectedWorkspace) {
    return (
      <ErrorState message="No workspace selected. Please select a workspace to continue." />
    );
  }

  const handleToggleMinimap = () => {
    setShowMinimap((prev) => !prev);
  };

  return (
    <>
      <Header
        prefixActions={[<SidebarToggle key="sidebar-toggle" />]}
        centerSlot={isMobile ? <ModelSelector /> : undefined}
        actions={[
          <TokenUsageIndicator key="token" sessionId={selectedSessionId} />,
          <DropdownMenu key="menu">
            <DropdownMenuTrigger
              render={
                <Button variant={"ghost"} size={"icon-sm"}>
                  <MoreHorizontal />
                </Button>
              }
            ></DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleToggleMinimap}>
                <PanelRight />
                <span className="whitespace-nowrap">Chat Outline</span>
                {showMinimap && (
                  <span className="ml-2 text-xs text-muted-foreground whitespace-nowrap">
                    (On)
                  </span>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={toggleTheme}>
                {isDarkMode ? <Sun /> : <Moon />}
                <span>{isDarkMode ? "Light Mode" : "Dark Mode"}</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => window.location.reload()}>
                <RefreshCw />
                <span>Refresh</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>,
        ]}
      />
      <ChatContainer
        directory={selectedWorkspace.directory}
        sessionId={selectedSessionId}
      />
    </>
  );
}
