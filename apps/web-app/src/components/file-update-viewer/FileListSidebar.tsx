import { FileText, FolderOpen, Plus, Minus } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { diffLines } from "diff";
import { cn } from "@/lib/utils";
import type { FileItem } from "./index";

interface FileListSidebarProps {
  files: FileItem[];
  selectedFile?: string;
  onSelectFile?: (file: FileItem) => void;
}

function getDiffStats(original: string, modified: string): { added: number; removed: number } {
  const changes = diffLines(original, modified);
  let added = 0;
  let removed = 0;
  for (const change of changes) {
    if (change.added) {
      added += change.value.split("\n").filter((l) => l !== "").length;
    } else if (change.removed) {
      removed += change.value.split("\n").filter((l) => l !== "").length;
    }
  }
  return { added, removed };
}

export function FileListSidebar({
  files,
  selectedFile,
  onSelectFile,
}: FileListSidebarProps) {
  function shortenPath(path: string, maxLen = 28): string {
    if (path.length <= maxLen) return path;
    const parts = path.split("/");
    if (parts.length <= 2) return path;
    const filename = parts.pop()!;
    const first = parts.shift()!;
    return `${first}/…/${filename}`;
  }

  return (
    <div className="flex flex-col h-full border-r bg-muted/30">
      <div className="p-2 border-b flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium">
          <FolderOpen className="size-4" />
          Files
        </div>
      </div>

      <div className="flex-1 overflow-auto py-1">
        {files.map((file) => {
          const isSelected = selectedFile === file.name;
          const isEditMode = file.originalContent !== undefined;
          const stats = isEditMode
            ? getDiffStats(file.originalContent!, file.content)
            : null;

          return (
            <button
              key={file.name}
              onClick={() => onSelectFile?.(file)}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted/50 transition-colors",
                isSelected && "bg-muted font-medium",
              )}
            >
              <FileText className="size-4 flex-shrink-0 text-muted-foreground" />
              <Tooltip>
                <TooltipTrigger render={<span className="truncate">{shortenPath(file.name)}</span>} />
                <TooltipContent side="right" className="max-w-xs break-all">
                  <p className="font-mono text-xs">{file.name}</p>
                </TooltipContent>
              </Tooltip>
              {stats && (
                <div className="ml-auto flex items-center gap-1.5 text-xs">
                  {stats.added > 0 && (
                    <span className="flex items-center gap-0.5 text-green-500">
                      <Plus className="size-3" />
                      {stats.added}
                    </span>
                  )}
                  {stats.removed > 0 && (
                    <span className="flex items-center gap-0.5 text-red-500">
                      <Minus className="size-3" />
                      {stats.removed}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
