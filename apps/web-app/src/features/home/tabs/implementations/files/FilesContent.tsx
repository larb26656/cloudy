import { useEffect, useMemo, useState } from "react";
import { PanelLeft, PanelLeftClose } from "lucide-react";
import { useTabStore } from "@/stores/tabStore";
import type { Tab } from "@/stores/tabStore";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { useVcsDiff } from "@/hooks/queries/useFiles";
import { useDeviceType } from "@/hooks";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { FilesList } from "./FilesList";
import { FileDetail } from "./FileDetail";
import { NoData } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface FilesContentProps {
  tab: Extract<Tab, { type: "files" }>;
}

export function FilesContent({ tab }: FilesContentProps) {
  const workspace = useWorkspaceStore((s) =>
    s.getWorkspace(tab.data.workspaceId),
  );

  const directory = workspace?.directory;
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

  const handleSelect = (file: string) => {
    setSelectedFile(file);
    if (isSmallScreen) {
      setIsSidebarOpen(false);
    }
  };

  if (!workspace || !directory) {
    return (
      <ErrorState
        message="Workspace not found. Please close this tab."
        onRetry={() => useTabStore.getState().removeTab(tab.id)}
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
        {isSmallScreen && (
          <div className="flex items-center border-b px-2 py-1.5">
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
          </div>
        )}
        <div className="min-w-0 flex-1">
          <FileDetail file={selected} />
        </div>
      </div>

      {isSmallScreen && (
        <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen} modal={false}>
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
