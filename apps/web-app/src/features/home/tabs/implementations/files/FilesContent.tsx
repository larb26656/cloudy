import { FilesContainer } from "@/components/files/FilesContainer";
import { ErrorState } from "@/components/ui/error-state";
import { useTabStore } from "@/stores/tabStore";
import type { Tab } from "@/stores/tabStore";

interface FilesContentProps {
  tab: Extract<Tab, { type: "files" }>;
}

export function FilesContent({ tab }: FilesContentProps) {
  const directory = tab.data.directory;

  if (!directory) {
    return (
      <ErrorState
        message="This files tab has no directory and can't be opened."
        onRetry={() => useTabStore.getState().removeTab(tab.id)}
      />
    );
  }

  return <FilesContainer directory={directory} />;
}
