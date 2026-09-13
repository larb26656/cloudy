import { BotChatContainer } from "@/components/chat/BotChatContainer";
import { Center } from "@/components/layout";
import { ErrorState } from "@repo/ui/components/error-state";
import { useWorkspace } from "@/hooks/queries";
import { useTabStore } from "@/stores/tabStore";
import type { Tab } from "@/stores/tabStore";

interface BotChatContentProps {
  tab: Extract<Tab, { type: "bot-chat" }>;
}

export function BotChatContent({ tab }: BotChatContentProps) {
  const updateTabData = useTabStore((s) => s.updateTabData);
  const { data: workspace } = useWorkspace(tab.data.workspaceId);

  if (!workspace || workspace.type !== "bot") {
    return (
      <Center className="h-full">
        <ErrorState message="Bot workspace not found" />
      </Center>
    );
  }

  return (
    <BotChatContainer
      workspace={workspace}
      directory={tab.data.directory}
      sessionId={tab.data.sessionId}
      onSessionChange={(sessionId) => updateTabData(tab.id, { sessionId })}
      model={tab.data.model}
      onModelChange={(model) => updateTabData(tab.id, { model })}
    />
  );
}
