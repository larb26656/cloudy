import { FileText, Plus, Trash2, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { IdeaFile } from "@/features/idea/types";
import { useState } from "react";

interface FileTreeSidebarProps {
  files: IdeaFile[];
  selectedFile: string;
  onSelectFile: (file: IdeaFile) => void;
  onCreateFile: (filename: string) => void;
  onDeleteFile: (filename: string) => void;
  disabled?: boolean;
  readOnly?: boolean;
}

export function FileTreeSidebar({
  files,
  selectedFile,
  onSelectFile,
  onCreateFile,
  onDeleteFile,
  disabled = false,
  readOnly = false,
}: FileTreeSidebarProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newFilename, setNewFilename] = useState("");

  const handleCreate = () => {
    if (!newFilename.trim()) return;
    const filename = newFilename.endsWith(".md")
      ? newFilename
      : `${newFilename}.md`;
    onCreateFile(filename);
    setNewFilename("");
    setIsCreating(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleCreate();
    } else if (e.key === "Escape") {
      setIsCreating(false);
      setNewFilename("");
    }
  };

  const canDelete = (filename: string) => filename !== "index.md";

  return (
    <div className="flex flex-col h-full border-r bg-muted/30">
      <div className="p-2 border-b flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium">
          <FolderOpen className="size-4" />
          Files
        </div>
        {!readOnly && (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => setIsCreating(true)}
            disabled={disabled}
            title="New file"
          >
            <Plus className="size-4" />
          </Button>
        )}
      </div>

      {isCreating && (
        <div className="p-2 border-b bg-muted/50">
          <Input
            placeholder="filename.md"
            value={newFilename}
            onChange={(e) => setNewFilename(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => {
              if (!newFilename.trim()) {
                setIsCreating(false);
              }
            }}
            autoFocus
            className="h-8 text-sm"
          />
        </div>
      )}

      <div className="flex-1 overflow-auto py-1">
        {files.map((file) => {
          const isSelected = selectedFile === file.name;
          return (
            <div
              key={file.name}
              className="group relative"
            >
              <button
                onClick={() => onSelectFile(file)}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted/50 transition-colors",
                  isSelected && "bg-muted font-medium",
                  disabled && "opacity-50 cursor-not-allowed",
                )}
                disabled={disabled}
              >
                <FileText className="size-4 flex-shrink-0 text-muted-foreground" />
                <span className="truncate">{file.name}</span>
              </button>
              {canDelete(file.name) && !disabled && !readOnly && (
                <button
                  onClick={() => onDeleteFile(file.name)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-destructive/10 rounded opacity-100 transition-opacity"
                  title="Delete file"
                >
                  <Trash2 className="size-3 text-destructive" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
