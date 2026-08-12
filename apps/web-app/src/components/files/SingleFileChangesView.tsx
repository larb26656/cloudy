import { useEffect, useMemo, useState } from "react";
import type { VcsFileDiff } from "@opencode-ai/sdk/v2";
import { Badge } from "@/components/ui/badge";
import { PathText } from "@/components/ui/path-text";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { FileDetail } from "./FileDetail";
import { FILE_CHANGE_STATUS_META } from "./file-change-status";
import { FilesList } from "./FilesList";
import { FilesResponsiveHeader } from "./FilesResponsiveHeader";

interface SingleFileChangesViewProps {
  directory: string;
  files: VcsFileDiff[];
  active: boolean;
}

export function SingleFileChangesView({
  directory,
  files,
  active,
}: SingleFileChangesViewProps) {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    setSelectedFile(null);
    setIsSidebarOpen(false);
  }, [directory]);

  useEffect(() => {
    if (!active) setIsSidebarOpen(false);
  }, [active]);

  const selected = useMemo(
    () => files.find((file) => file.file === selectedFile) ?? null,
    [files, selectedFile],
  );
  const selectedMeta = selected
    ? (FILE_CHANGE_STATUS_META[selected.status ?? "modified"] ??
      FILE_CHANGE_STATUS_META.modified)
    : null;

  const handleSelect = (file: string) => {
    setSelectedFile(file);
    setIsSidebarOpen(false);
  };

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
    <div className={active ? "flex h-full" : "hidden h-full"}>
      <div className="hidden w-[300px] shrink-0 flex-col border-r @files:flex">
        {sidebarHeader}
        {sidebarBody}
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <FilesResponsiveHeader
          hasSelection={Boolean(selected)}
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={() => setIsSidebarOpen((previous) => !previous)}
          openTitle="Show file list"
          closeTitle="Hide file list"
        >
          {selected && selectedMeta && (
            <>
              <Badge variant={selectedMeta.variant}>
                <span className="@files:hidden">{selectedMeta.short}</span>
                <span className="hidden @files:inline">
                  {selectedMeta.label}
                </span>
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
        </FilesResponsiveHeader>
        <div className="min-h-0 min-w-0 flex-1">
          <FileDetail file={selected} />
        </div>
      </div>

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
    </div>
  );
}
