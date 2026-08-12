import { useEffect, useState } from "react";
import { ListTree, PanelLeft } from "lucide-react";
import { Center } from "@/components/layout";
import { NoData } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useVcsDiff } from "@/hooks/queries/useFiles";
import { AllFilesChangesView } from "./AllFilesChangesView";
import { SingleFileChangesView } from "./SingleFileChangesView";

interface FilesChangesProps {
  directory: string;
}

type ChangesViewMode = "all-files" | "single-file";

export function FilesChanges({ directory }: FilesChangesProps) {
  const { data, isLoading, error, refetch } = useVcsDiff({ directory });
  const [viewMode, setViewMode] = useState<ChangesViewMode>("all-files");

  useEffect(() => {
    setViewMode("all-files");
  }, [directory]);

  const handleViewModeChange = (values: string[]) => {
    const nextMode = values[0] as ChangesViewMode | undefined;
    if (nextMode) setViewMode(nextMode);
  };

  if (isLoading) {
    return (
      <Center className="h-full">
        <LoadingState title="Loading changes" message={directory} />
      </Center>
    );
  }

  if (error) {
    return (
      <Center className="h-full">
        <ErrorState message={error.message} onRetry={() => refetch()} />
      </Center>
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
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center justify-between border-b px-3 py-2">
        <span className="text-xs font-medium text-muted-foreground">
          {files.length} file{files.length === 1 ? "" : "s"} changed
        </span>
        <ToggleGroup
          value={[viewMode]}
          onValueChange={handleViewModeChange}
          variant="outline"
          size="sm"
          aria-label="Changes view"
        >
          <ToggleGroupItem value="all-files" aria-label="All files">
            <ListTree data-icon="inline-start" />
            All files
          </ToggleGroupItem>
          <ToggleGroupItem value="single-file" aria-label="Single file">
            <PanelLeft data-icon="inline-start" />
            Single file
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      <div className="min-h-0 flex-1">
        <AllFilesChangesView
          directory={directory}
          files={files}
          active={viewMode === "all-files"}
        />
        <SingleFileChangesView
          directory={directory}
          files={files}
          active={viewMode === "single-file"}
        />
      </div>
    </div>
  );
}
