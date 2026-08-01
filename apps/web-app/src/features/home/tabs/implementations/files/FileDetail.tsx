import type { VcsFileDiff } from "@opencode-ai/sdk/v2";
import { DiffViewer } from "@/components/markdown/DiffViewer";
import { Badge } from "@/components/ui/badge";
import { NoData } from "@/components/ui/empty-state";
import { PathText } from "@/components/ui/path-text";

interface FileDetailProps {
  file: VcsFileDiff | null;
}

const STATUS_VARIANT = {
  added: "default",
  modified: "secondary",
  deleted: "destructive",
} as const;

export function FileDetail({ file }: FileDetailProps) {
  if (!file) {
    return (
      <NoData
        className="h-full"
        description="Select a file from the list to view its changes."
      />
    );
  }

  const status = file.status ?? "modified";

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b px-4 py-2.5">
        <Badge variant={STATUS_VARIANT[status]}>{status}</Badge>
        <PathText
          path={file.file}
          className="min-w-0 flex-1 font-mono text-sm"
        />
        <span className="flex shrink-0 items-center gap-2 text-xs tabular-nums">
          <span className="text-green-600 dark:text-green-400">
            +{file.additions}
          </span>
          <span className="text-red-600 dark:text-red-400">
            −{file.deletions}
          </span>
        </span>
      </div>
      <div className="min-h-0 flex-1 overflow-auto">
        {file.patch ? (
          <DiffViewer
            diff={file.patch}
            filePath={file.file}
            defaultViewMode="line-by-line"
            showLineNumbers={true}
            headless={true}
          />
        ) : (
          <NoData
            className="h-full"
            description="This file has no inline patch to display."
          />
        )}
      </div>
    </div>
  );
}
