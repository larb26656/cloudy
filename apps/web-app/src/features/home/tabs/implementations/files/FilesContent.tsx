import { useEffect, useMemo, useState } from "react";
import type { Tab } from "@/stores/tabStore";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { useVcsDiff } from "@/hooks/queries/useFiles";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { FilesList } from "./FilesList";
import { FileDetail } from "./FileDetail";
import { NoData } from "@/components/ui/empty-state";

interface FilesContentProps {
  tab: Extract<Tab, { type: "files" }>;
}

export function FilesContent({ tab: _tab }: FilesContentProps) {
  const workspaceId = useWorkspaceStore((s) => s.selectedWorkspaceId);
  const workspace = useWorkspaceStore((s) =>
    s.selectedWorkspaceId ? s.getWorkspace(s.selectedWorkspaceId) : undefined,
  );

  const directory = workspace?.directory;
  const { data, isLoading, error, refetch } = useVcsDiff({ directory });

  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  useEffect(() => {
    setSelectedFile(null);
  }, [directory]);

  const selected = useMemo(
    () => (data ?? []).find((f) => f.file === selectedFile) ?? null,
    [data, selectedFile],
  );

  if (!workspaceId || !directory) {
    return (
      <NoData
        className="h-full"
        description="Select a workspace to view its changed files."
      />
    );
  }

  if (isLoading) {
    return (
      <div className="h-full flex justify-center">
        <LoadingState title="Loading changes" message={directory} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex justify-center">
        <ErrorState message={error.message} onRetry={() => refetch()} />
      </div>
    );
  }

  const files = data ?? [];

  if (files.length === 0) {
    return (
      <NoData
        className="h-full"
        description="There are no uncommitted changes in this workspace."
      />
    );
  }

  return (
    <div className="flex h-full">
      <div className="flex w-[300px] shrink-0 flex-col border-r">
        <div className="border-b px-3 py-2 text-xs font-medium text-muted-foreground">
          {files.length} file{files.length === 1 ? "" : "s"} changed
        </div>
        <div className="min-h-0 flex-1">
          <FilesList
            files={files}
            selectedFile={selectedFile}
            onSelect={setSelectedFile}
          />
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <FileDetail file={selected} />
      </div>
    </div>
  );
}
