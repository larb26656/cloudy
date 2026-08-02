import { TerminalView } from "@/components/terminal";
import { ErrorState } from "@/components/ui/error-state";
import { useTabStore } from "@/stores/tabStore";
import type { Tab } from "@/stores/tabStore";

interface TerminalContentProps {
  tab: Extract<Tab, { type: "terminal" }>;
}

export function TerminalContent({ tab }: TerminalContentProps) {
  const updateTabData = useTabStore((s) => s.updateTabData);
  const directory = tab.data.directory;

  if (!directory) {
    return (
      <ErrorState
        message="Workspace directory missing. Please close this tab."
        onRetry={() => useTabStore.getState().removeTab(tab.id)}
      />
    );
  }

  return (
    <TerminalView
      directory={directory}
      ptyId={tab.data.ptyId}
      onPtyChange={(ptyId) => updateTabData(tab.id, { ptyId })}
      className="h-full w-full"
    />
  );
}
