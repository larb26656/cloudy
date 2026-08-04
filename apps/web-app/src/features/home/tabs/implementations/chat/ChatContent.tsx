import { ChatContainer } from "@/components/chat/ChatContainer";
import { ErrorState } from "@/components/ui/error-state";
import { useTabStore } from "@/stores/tabStore";
import type { Tab } from "@/stores/tabStore";
import { useWorkspace } from "@/hooks/queries";
import { Center } from "@/components/layout";

interface ChatContentProps {
  tab: Extract<Tab, { type: "chat" }>;
}

export function ChatContent({ tab }: ChatContentProps) {
  const updateTabData = useTabStore((s) => s.updateTabData);
  // Workspace lookup is cosmetic only — used to surface the workspace
  // name/color via ChatContainer. The chat itself runs entirely on
  // `tab.data.directory`, so a missing/ephemeral workspace does not block.
  const { data: workspace } = useWorkspace(tab.data.workspaceId);

  if (!tab.data.directory) {
    return (
      <Center className="h-full">
        <ErrorState
          message="This chat tab has no directory and can't be opened."
          onRetry={() => useTabStore.getState().removeTab(tab.id)}
        />
      </Center>
    );
  }

  return (
    <ChatContainer
      workspace={workspace ?? null}
      directory={tab.data.directory}
      sessionId={tab.data.sessionId}
      onSessionChange={(sessionId) => updateTabData(tab.id, { sessionId })}
    />
  );
}
