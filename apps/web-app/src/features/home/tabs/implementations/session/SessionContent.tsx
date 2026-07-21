import { ChatContainer } from "@/components/chat/ChatContainer";
import { ErrorState } from "@/components/ui/error-state";
import { useTabStore } from "@/stores/tabStore";
import type { Tab } from "@/stores/tabStore";
import { useWorkspaceStore } from "@/stores/workspaceStore";

interface SessionContentProps {
  tab: Extract<Tab, { type: "session" }>;
}

export function SessionContent({ tab }: SessionContentProps) {
  const updateTabData = useTabStore((s) => s.updateTabData);
  const workspace = useWorkspaceStore((s) => s.getWorkspace(tab.data.workspaceId));

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
