import { File as FileIcon } from "lucide-react";
import type { ReactNode } from "react";
import { useFileSearch } from "@/hooks/queries/useFiles";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PathText } from "@/components/ui/path-text";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { EmptyState } from "@/components/ui/empty-state";

interface FileSearchResultsProps {
  directory: string;
  query: string;
  selectedPath: string | null;
  onSelect: (path: string) => void;
}

export function FileSearchResults({
  directory,
  query,
  selectedPath,
  onSelect,
}: FileSearchResultsProps) {
  const trimmed = query.trim();
  const { data, isLoading, error, refetch } = useFileSearch({
    directory,
    query: trimmed,
  });

  let content: ReactNode;
  if (isLoading) {
    content = <LoadingState size="inline" title="Searching…" spinner={false} />;
  } else if (error) {
    content = (
      <ErrorState
        size="inline"
        bare
        message={error.message}
        onRetry={() => refetch()}
      />
    );
  } else if (trimmed.length < 2) {
    content = (
      <EmptyState size="inline" title="Type at least 2 characters to search" />
    );
  } else {
    const rows = data ?? [];
    if (rows.length === 0) {
      content = <EmptyState size="inline" title="No files found" />;
    } else {
      content = (
        <ul className="flex flex-col py-1">
          {rows.map((path) => (
            <li key={path}>
              <button
                onClick={() => onSelect(path)}
                className={cn(
                  "flex w-full items-center gap-1.5 px-3 py-1 text-left text-sm transition-colors",
                  path === selectedPath
                    ? "bg-muted text-foreground"
                    : "hover:bg-muted/50 text-muted-foreground",
                )}
              >
                <FileIcon
                  data-icon
                  className="size-4 shrink-0 text-muted-foreground"
                />
                <PathText
                  path={path}
                  className="min-w-0 flex-1 font-mono text-xs"
                />
              </button>
            </li>
          ))}
        </ul>
      );
    }
  }

  return <ScrollArea className="h-full">{content}</ScrollArea>;
}
