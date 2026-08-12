import { FileWarning } from "lucide-react";
import type { ReactNode } from "react";
import { useFileRead } from "@/hooks/queries/useFiles";
import { CodeView } from "@/components/markdown/CodeView";
import { EmptyState, NoData } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";

interface FilePreviewProps {
  directory: string;
  path: string | null;
}

export function FilePreview({ directory, path }: FilePreviewProps) {
  let content: ReactNode;
  if (!path) {
    content = (
      <NoData
        className="h-full"
        description="Select a file from the tree to view its content."
      />
    );
    return <div className="h-full">{content}</div>;
  }

  return <FilePreviewBody directory={directory} path={path} />;
}

function FilePreviewBody({
  directory,
  path,
}: {
  directory: string;
  path: string;
}) {
  const { data, isLoading, error, refetch } = useFileRead({ directory, path });

  let content: ReactNode;
  if (isLoading) {
    content = (
      <LoadingState title="Loading file" message={path} className="h-full" />
    );
  } else if (error) {
    content = (
      <ErrorState
        className="h-full"
        message={error.message}
        onRetry={() => refetch()}
      />
    );
  } else if (!data) {
    content = (
      <NoData className="h-full" description="This file has no content." />
    );
  } else if (data.type === "binary") {
    content = (
      <EmptyState
        className="h-full"
        icon={FileWarning}
        title="Binary file"
        description="This file type can't be previewed as text."
      />
    );
  } else {
    content = (
      <div className="h-full overflow-auto">
        <CodeView fileName={path} showLineNumbers>
          {data.content}
        </CodeView>
      </div>
    );
  }

  return <div className="h-full">{content}</div>;
}
