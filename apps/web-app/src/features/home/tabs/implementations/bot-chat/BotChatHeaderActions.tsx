import { EllipsisVertical } from "lucide-react";
import { AppBar } from "@/components/layout";
import { ChatSessionMenu } from "@/components/chat/ChatSessionMenu";
import { useTabStore } from "@/stores/tabStore";
import type { TabHeaderActionsProps } from "../../template";

export function BotChatHeaderActions({ tab }: TabHeaderActionsProps) {
  const updateTabData = useTabStore((s) => s.updateTabData);

  if (tab.type !== "bot-chat") return null;

  return (
    <ChatSessionMenu
      sessionId={tab.data.sessionId}
      directory={tab.data.directory}
      onSessionChange={(sessionId) =>
        updateTabData(
          tab.id,
          sessionId === null
            ? { sessionId, sessionName: "New Bot Chat" }
            : { sessionId },
        )
      }
      trigger={
        <AppBar.ActionIcon icon={EllipsisVertical} label="Session menu" />
      }
    />
  );
}
