import { useMemo, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import type { VcsFileDiff } from "@opencode-ai/sdk/v2";
import { DiffView } from "@/components/markdown/DiffView";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { NoData } from "@/components/ui/empty-state";
import { PathText } from "@/components/ui/path-text";
import { FILE_CHANGE_STATUS_META } from "./file-change-status";
import { OpenFullFileButton } from "./OpenFullFileButton";

interface AllFilesChangesViewProps {
  directory: string;
  files: VcsFileDiff[];
  active: boolean;
  onOpenFile: (path: string) => void;
}

interface VirtualizedChangesListProps {
  files: VcsFileDiff[];
  active: boolean;
  onOpenFile: (path: string) => void;
}

const ESTIMATED_EXPANDED_HEIGHT = 600;
const ESTIMATED_COLLAPSED_HEIGHT = 44;

function VirtualizedChangesList({
  files,
  active,
  onOpenFile,
}: VirtualizedChangesListProps) {
  const scrollElementRef = useRef<HTMLDivElement>(null);
  const [expandedFiles, setExpandedFiles] = useState<string[]>([]);
  const expandedFileSet = useMemo(
    () => new Set(expandedFiles),
    [expandedFiles],
  );
  const virtualizer = useVirtualizer({
    count: files.length,
    enabled: active,
    getScrollElement: () => scrollElementRef.current,
    getItemKey: (index) => files[index]?.file ?? index,
    estimateSize: (index) =>
      expandedFileSet.has(files[index]?.file ?? "")
        ? ESTIMATED_EXPANDED_HEIGHT
        : ESTIMATED_COLLAPSED_HEIGHT,
    initialRect: { width: 0, height: ESTIMATED_EXPANDED_HEIGHT },
    overscan: 1,
  });

  return (
    <div
      ref={scrollElementRef}
      data-testid="all-files-changes-scroll"
      className="min-h-0 min-w-0 max-w-full flex-1 overflow-x-hidden overflow-y-auto"
    >
      <Accordion
        multiple
        value={expandedFiles}
        onValueChange={setExpandedFiles}
        className="relative min-w-0 max-w-full"
        style={{ height: virtualizer.getTotalSize() }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => {
          const file = files[virtualItem.index];
          if (!file) return null;

          const meta =
            FILE_CHANGE_STATUS_META[file.status ?? "modified"] ??
            FILE_CHANGE_STATUS_META.modified;

          return (
            <AccordionItem
              key={file.file}
              ref={virtualizer.measureElement}
              data-index={virtualItem.index}
              value={file.file}
              className="absolute top-0 left-0 min-w-0 max-w-full overflow-hidden"
              style={{
                width: "100%",
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              <div className="relative">
                <AccordionTrigger className="min-w-0 rounded-none px-3 py-2.5 pr-16 hover:no-underline">
                  <div className="flex min-w-0 flex-1 items-center gap-2 pr-2">
                    <Badge variant={meta.variant}>{meta.short}</Badge>
                    <PathText
                      path={file.file}
                      className="min-w-0 flex-1 overflow-hidden font-mono text-xs"
                    />
                    <span className="flex shrink-0 items-center gap-2 text-xs font-normal tabular-nums">
                      <span className="text-green-600 dark:text-green-400">
                        +{file.additions}
                      </span>
                      <span className="text-red-600 dark:text-red-400">
                        −{file.deletions}
                      </span>
                    </span>
                  </div>
                </AccordionTrigger>
                <OpenFullFileButton
                  path={file.file}
                  status={file.status}
                  onOpen={onOpenFile}
                  className="absolute top-2.5 right-8"
                />
              </div>
              <AccordionContent className="min-w-0 max-w-full pb-0">
                {file.patch ? (
                  <DiffView
                    diff={file.patch}
                    filePath={file.file}
                    viewMode="line-by-line"
                    showLineNumbers={true}
                    className="w-full min-w-0 max-w-full overflow-x-auto overflow-y-visible"
                  />
                ) : (
                  <NoData
                    size="compact"
                    description="This file has no inline patch to display."
                  />
                )}
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}

export function AllFilesChangesView({
  directory,
  files,
  active,
  onOpenFile,
}: AllFilesChangesViewProps) {
  const accordionKey = `${directory}:${files.map((file) => file.file).join("\0")}`;

  return (
    <div
      className={
        active
          ? "flex h-full min-w-0 max-w-full flex-col overflow-hidden"
          : "hidden h-full"
      }
    >
      <VirtualizedChangesList
        key={accordionKey}
        files={files}
        active={active}
        onOpenFile={onOpenFile}
      />
    </div>
  );
}
