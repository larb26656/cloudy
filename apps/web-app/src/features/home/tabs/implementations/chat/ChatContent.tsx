import { ChatContainer } from "@/components/chat/ChatContainer";
import { ErrorState } from "@/components/ui/error-state";
import { useTabStore } from "@/stores/tabStore";
import type { Tab } from "@/stores/tabStore";
import { useWorkspace } from "@/hooks/queries";

interface ChatContentProps {
  tab: Extract<Tab, { type: "chat" }>;
}

export function ChatContent({ tab }: ChatContentProps) {
  const updateTabData = useTabStore((s) => s.updateTabData);
  const { data: workspace, isLoading } = useWorkspace(tab.data.workspaceId);

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
        Loading workspace...
      </div>
    );
  }

  if (!workspace) {
    return (
      <ErrorState
        message="Workspace not found. Please close this tab."
        onRetry={() => useTabStore.getState().removeTab(tab.id)}
      />
    );
  }

  return (
    <ChatContainer
      directory={workspace.directory}
      sessionId={tab.data.sessionId}
      onSessionChange={(sessionId) => updateTabData(tab.id, { sessionId })}
    />
  );
}
