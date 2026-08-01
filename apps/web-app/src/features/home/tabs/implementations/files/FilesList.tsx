import type { VcsFileDiff } from "@opencode-ai/sdk/v2";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PathText } from "@/components/ui/path-text";

const STATUS_STYLES: Record<string, string> = {
  added: "text-green-600 dark:text-green-400",
  modified: "text-amber-600 dark:text-amber-400",
  deleted: "text-red-600 dark:text-red-400",
};

const STATUS_LABEL: Record<string, string> = {
  added: "A",
  modified: "M",
  deleted: "D",
};

interface FilesListProps {
  files: VcsFileDiff[];
  selectedFile: string | null;
  onSelect: (file: string) => void;
}

export function FilesList({ files, selectedFile, onSelect }: FilesListProps) {
  return (
    <ScrollArea className="h-full">
      <ul className="flex flex-col py-1">
        {files.map((file) => {
          const status = file.status ?? "modified";
          const isSelected = file.file === selectedFile;
          return (
            <li key={file.file}>
              <button
                onClick={() => onSelect(file.file)}
                className={cn(
                  "flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm transition-colors",
                  isSelected
                    ? "bg-muted text-foreground"
                    : "hover:bg-muted/50 text-muted-foreground",
                )}
              >
                <span
                  className={cn(
                    "flex size-4 shrink-0 items-center justify-center rounded text-[10px] font-semibold",
                    STATUS_STYLES[status],
                  )}
                  title={status}
                >
                  {STATUS_LABEL[status] ?? "?"}
                </span>
                <PathText
                  path={file.file}
                  className="min-w-0 flex-1 font-mono text-xs"
                />
                <span className="flex shrink-0 items-center gap-1 text-[11px] tabular-nums">
                  {file.additions > 0 && (
                    <span className="text-green-600 dark:text-green-400">
                      +{file.additions}
                    </span>
                  )}
                  {file.deletions > 0 && (
                    <span className="text-red-600 dark:text-red-400">
                      −{file.deletions}
                    </span>
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </ScrollArea>
  );
}
