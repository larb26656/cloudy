import { useEffect, useMemo, useState } from "react";
import { PanelLeft, PanelLeftClose } from "lucide-react";
import { useVcsDiff } from "@/hooks/queries/useFiles";
import { useDeviceType } from "@/hooks";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { FilesList } from "./FilesList";
import { FileDetail } from "./FileDetail";
import { NoData } from "@/components/ui/empty-state";
import { Center } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { PathText } from "@/components/ui/path-text";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

const STATUS_META = {
  added: { variant: "default", short: "A", label: "added" },
  modified: { variant: "secondary", short: "M", label: "modified" },
  deleted: { variant: "destructive", short: "D", label: "deleted" },
} as const;

interface FilesChangesProps {
  directory: string;
}

export function FilesChanges({ directory }: FilesChangesProps) {
  const { data, isLoading, error, refetch } = useVcsDiff({ directory });

  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const { isMobile, isTablet } = useDeviceType();
  const isSmallScreen = isMobile || isTablet;
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    setSelectedFile(null);
  }, [directory]);

  const selected = useMemo(
    () => (data ?? []).find((f) => f.file === selectedFile) ?? null,
    [data, selectedFile],
  );

  const selectedMeta = selected
    ? (STATUS_META[selected.status ?? "modified"] ?? STATUS_META.modified)
    : null;

  const handleSelect = (file: string) => {
    setSelectedFile(file);
    if (isSmallScreen) {
      setIsSidebarOpen(false);
    }
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

  const sidebarHeader = (
    <div className="border-b px-3 py-2 text-xs font-medium text-muted-foreground">
      {files.length} file{files.length === 1 ? "" : "s"} changed
    </div>
  );

  const sidebarBody = (
    <div className="min-h-0 flex-1">
      <FilesList
        files={files}
        selectedFile={selectedFile}
        onSelect={handleSelect}
      />
    </div>
  );

  return (
    <div className="flex h-full">
      {!isSmallScreen && (
        <div className="flex w-[300px] shrink-0 flex-col border-r">
          {sidebarHeader}
          {sidebarBody}
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        {(selected || isSmallScreen) && (
          <div className="flex items-center gap-2 border-b px-4 py-2.5">
            {isSmallScreen && (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setIsSidebarOpen((prev) => !prev)}
                title={isSidebarOpen ? "Hide file list" : "Show file list"}
              >
                {isSidebarOpen ? (
                  <PanelLeftClose className="size-4" />
                ) : (
                  <PanelLeft className="size-4" />
                )}
              </Button>
            )}
            {selected && selectedMeta && (
              <>
                <Badge variant={selectedMeta.variant}>
                  {isSmallScreen ? selectedMeta.short : selectedMeta.label}
                </Badge>
                <PathText
                  path={selected.file}
                  className="min-w-0 flex-1 font-mono text-sm"
                />
                <span className="flex shrink-0 items-center gap-2 text-xs tabular-nums">
                  <span className="text-green-600 dark:text-green-400">
                    +{selected.additions}
                  </span>
                  <span className="text-red-600 dark:text-red-400">
                    −{selected.deletions}
                  </span>
                </span>
              </>
            )}
          </div>
        )}
        <div className="min-h-0 min-w-0 flex-1">
          <FileDetail file={selected} />
        </div>
      </div>

      {isSmallScreen && (
        <Sheet
          open={isSidebarOpen}
          onOpenChange={setIsSidebarOpen}
          modal={false}
        >
          <SheetContent
            side="left"
            className="w-[280px] gap-0 p-0 sm:w-[320px]"
            showCloseButton={false}
          >
            <SheetHeader className="sr-only">
              <SheetTitle>Changed files</SheetTitle>
            </SheetHeader>
            {sidebarHeader}
            {sidebarBody}
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
}
