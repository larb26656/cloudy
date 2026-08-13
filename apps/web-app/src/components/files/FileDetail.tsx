import type { VcsFileDiff } from "@opencode-ai/sdk/v2";
import { DiffView } from "@/components/markdown/DiffView";
import { NoData } from "@/components/ui/empty-state";

interface FileDetailProps {
  file: VcsFileDiff | null;
}

export function FileDetail({ file }: FileDetailProps) {
  if (!file) {
    return (
      <NoData
        className="h-full"
        description="Select a file from the list to view its changes."
      />
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex min-h-0 flex-1 flex-col">
        {file.patch ? (
          <DiffView
            diff={file.patch}
            filePath={file.file}
            viewMode="line-by-line"
            showLineNumbers={true}
            compactContextLines={3}
            showFullContextToggle={true}
            progressiveLineLimit={500}
            className="min-h-0 flex-1"
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
