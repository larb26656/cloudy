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

interface AllFilesChangesViewProps {
  directory: string;
  files: VcsFileDiff[];
  active: boolean;
}

export function AllFilesChangesView({
  directory,
  files,
  active,
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
      <div className="min-h-0 min-w-0 max-w-full flex-1 overflow-x-hidden overflow-y-auto">
        <Accordion
          key={accordionKey}
          multiple
          defaultValue={files.map((file) => file.file)}
          className="min-w-0 max-w-full"
        >
          {files.map((file) => {
            const meta =
              FILE_CHANGE_STATUS_META[file.status ?? "modified"] ??
              FILE_CHANGE_STATUS_META.modified;

            return (
              <AccordionItem
                key={file.file}
                value={file.file}
                className="min-w-0 max-w-full overflow-hidden"
              >
                <AccordionTrigger className="min-w-0 rounded-none px-3 py-2.5 hover:no-underline">
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
    </div>
  );
}
