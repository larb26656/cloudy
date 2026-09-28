import { EllipsisVertical, PanelRight } from "lucide-react";
import { AppBar } from "@/components/layout";
import { cn } from "@repo/ui/lib/utils";
import { useChatPanelStore } from "@/stores/chatPanelStore";
import { useTabStore } from "@/stores/tabStore";
import { ChatSessionMenu } from "@/components/chat/ChatSessionMenu";
import type { TabHeaderActionsProps } from "../../template";
import { ProviderSelector } from "@/components/chat/ProviderSelector";
import { useCreateSession } from "@/hooks/queries/useSessions";

export function ChatHeaderActions({ tab }: TabHeaderActionsProps) {
  const filesOpen = useChatPanelStore(
    (s) => s.filesOpenByTabId[tab.id] ?? false,
  );
  const toggleFiles = useChatPanelStore((s) => s.toggleFiles);
  const updateTabData = useTabStore((s) => s.updateTabData);
  const createSession = useCreateSession();

  if (tab.type !== "chat") return null;

  return (
    <>
      <ProviderSelector
        providerId={tab.data.providerId}
        sessionId={tab.data.sessionId}
        onContinue={(providerId) => {
          if (!tab.data.sessionId) return;
          createSession.mutate(
            {
              directory: tab.data.directory,
              providerId,
              transferContext: {
                summary: "Continue the current conversation",
                files: [],
                diff: "",
                task: "Continue the current task",
                unresolvedQuestions: [],
              },
            },
            {
              onSuccess: (session) =>
                updateTabData(tab.id, {
                  providerId,
                  sessionId: session.id,
                  sessionName: session.title || tab.data.sessionName,
                  agent: null,
                  model: null,
                }),
            },
          );
        }}
      />
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
