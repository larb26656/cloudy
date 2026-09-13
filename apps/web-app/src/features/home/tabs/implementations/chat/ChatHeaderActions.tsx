import { EllipsisVertical, PanelRight } from "lucide-react";
import { AppBar } from "@/components/layout";
import { cn } from "@repo/ui/lib/utils";
import { useChatPanelStore } from "@/stores/chatPanelStore";
import { useTabStore } from "@/stores/tabStore";
import { ChatSessionMenu } from "@/components/chat/ChatSessionMenu";
import type { TabHeaderActionsProps } from "../../template";

export function ChatHeaderActions({ tab }: TabHeaderActionsProps) {
  const filesOpen = useChatPanelStore(
    (s) => s.filesOpenByTabId[tab.id] ?? false,
  );
  const toggleFiles = useChatPanelStore((s) => s.toggleFiles);
  const updateTabData = useTabStore((s) => s.updateTabData);

  if (tab.type !== "chat") return null;

  return (
    <>
      <ChatSessionMenu
        sessionId={tab.data.sessionId}
        directory={tab.data.directory}
        onSessionChange={(sessionId) => updateTabData(tab.id, { sessionId })}
        trigger={
          <AppBar.ActionIcon icon={EllipsisVertical} label="Session menu" />
        }
      />
      <AppBar.ActionIcon
        icon={PanelRight}
        label="Toggle files panel"
        onClick={() => toggleFiles(tab.id)}
        data-active={filesOpen ? "true" : undefined}
        className={cn(filesOpen && "bg-muted text-foreground")}
      />
    </>
  );
}
