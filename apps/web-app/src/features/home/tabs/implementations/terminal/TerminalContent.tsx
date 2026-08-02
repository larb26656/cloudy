import { TerminalView } from "@/components/terminal";
import { ErrorState } from "@/components/ui/error-state";
import { useTabStore } from "@/stores/tabStore";
import type { Tab } from "@/stores/tabStore";
import { useWorkspaceStore } from "@/stores/workspaceStore";

interface TerminalContentProps {
  tab: Extract<Tab, { type: "terminal" }>;
}

export function TerminalContent({ tab }: TerminalContentProps) {
  const updateTabData = useTabStore((s) => s.updateTabData);
  const workspace = useWorkspaceStore((s) =>
    s.getWorkspace(tab.data.workspaceId),
  );

  if (!workspace) {
    return (
      <ErrorState
        message="Workspace not found. Please close this tab."
        onRetry={() => useTabStore.getState().removeTab(tab.id)}
      />
    );
  }

  return (
    <TerminalView
      className="h-full w-full"
      directory={workspace.directory}
      ptyId={tab.data.ptyId}
      onPtyChange={(ptyId) => updateTabData(tab.id, { ptyId })}
    />
  );
}
