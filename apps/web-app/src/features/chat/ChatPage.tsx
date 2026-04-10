import { ChatContainer } from "@/components/chat/ChatContainer";
import { TokenUsageIndicator } from "@/components/chat/TokenUsageIndicator";
import { Header } from "@/components/layout";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useEventStream } from "@/hooks/useEventSteam";
import { useDeviceType } from "@/hooks";
import { useChatUIStore, useMessageStore, useSessionStore } from "@/stores";
import { useEffect, useState } from "react";
import { RefreshCw, Sun, Moon, PanelRight, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ModelSelector } from "@/components/chat/ModelSelector";

type SnippetType = "idea" | "memory" | "artifact";

const snippetPrompts: Record<SnippetType, string> = {
  idea: "ฉันอยากได้ไอเดียใหม่ๆ ช่วย brainstorm ให้หน่อย",
  memory: "ฉันอยากบันทึกความจำสำคัญ",
  artifact: "ช่วยสร้าง artifact ให้หน่อย",
};

export default function ChatPage() {
  const { selectedSessionId } = useSessionStore();
  const { messages, loadMessages } = useMessageStore();
  const { isDarkMode, toggleTheme } = useChatUIStore();
  const { isMobile } = useDeviceType();
  const [initialInput, setInitialInput] = useState<string>("");
  const [showMinimap, setShowMinimap] = useState(false);

  useEventStream();

  useEffect(() => {
    if (!selectedSessionId) return;

    const hasLoaded = !!messages[selectedSessionId];
    if (hasLoaded) return;

    loadMessages(selectedSessionId);
  }, [selectedSessionId, messages, loadMessages]);

  const handleSnippetSelect = (type: SnippetType) => {
    setInitialInput(snippetPrompts[type]);
  };

  const handleToggleMinimap = () => {
    setShowMinimap((prev) => !prev);
  };

  const handleCloseMinimap = () => {
    setShowMinimap(false);
  };

  return (
    <>
      <Header
        centerSlot={isMobile ? <ModelSelector /> : undefined}
        actions={[
          <TokenUsageIndicator key="token" sessionId={selectedSessionId} />,
          <DropdownMenu key="menu">
            <DropdownMenuTrigger>
              <Button variant={"ghost"} size={"icon-sm"}>
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
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
        sessionId={selectedSessionId}
        onSnippetSelect={handleSnippetSelect}
        initialInput={initialInput}
        showMinimap={showMinimap}
        onCloseMinimap={handleCloseMinimap}
        showModelSelector={!isMobile}
      />
    </>
  );
}
