import { ChatContainer } from "@/components/chat/ChatContainer";
import { ErrorState } from "@/components/ui/error-state";
import { useWorkspaceStore } from "@/stores/workspaceStore";

export function DeskPage() {
  const selectedWorkspace = useWorkspaceStore((s) =>
    s.selectedWorkspaceId ? s.getWorkspace(s.selectedWorkspaceId) : undefined,
  );

  if (!selectedWorkspace) {
    return (
      <ErrorState message="No workspace selected. Please select a workspace to continue." />
    );
  }

  return (
    <div className="flex gap-2 h-full">
      <div className="flex-1 h-full">
        <ChatContainer
          directory={selectedWorkspace.directory}
          sessionId={"ses_0cd1ecaf1ffew1jgOKkebREFHa"}
        />
      </div>
      <div className="flex-1 h-full">
        <ChatContainer
          directory={selectedWorkspace.directory}
          sessionId={"ses_0cd21a9baffeQE7mN8zAJZ436L"}
        />
      </div>
    </div>
  );
}
