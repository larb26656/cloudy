import { ChatContainer } from "@/components/chat/ChatContainer";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { useTabStore } from "@/stores/tabStore";
import type { Tab } from "@/stores/tabStore";
import { useWorkspace } from "@/hooks/queries";
import { Center } from "@/components/layout";

interface ChatContentProps {
  tab: Extract<Tab, { type: "chat" }>;
}

export function ChatContent({ tab }: ChatContentProps) {
  const updateTabData = useTabStore((s) => s.updateTabData);
  const { data: workspace, isLoading } = useWorkspace(tab.data.workspaceId);

  if (isLoading) {
    return (
      <Center className="h-full">
        <LoadingState title="Loading workspace..." spinner={false} />
      </Center>
    );
  }

  if (!workspace) {
    return (
      <Center className="h-full">
        <ErrorState
          message="Workspace not found. Please close this tab."
          onRetry={() => useTabStore.getState().removeTab(tab.id)}
        />
      </Center>
    );
  }

  return (
    <ChatContainer
      workspace={workspace}
      directory={workspace.directory}
      sessionId={tab.data.sessionId}
      onSessionChange={(sessionId) => updateTabData(tab.id, { sessionId })}
    />
  );
}
