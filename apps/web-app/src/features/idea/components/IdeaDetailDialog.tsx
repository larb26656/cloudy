import { Lightbulb, Tag, PanelLeftClose, PanelLeft, Loader2 } from "lucide-react";
import { useState, useEffect, useCallback, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { StatusBadge, PriorityBadge } from "@/features/idea/components";
import { FileTreeSidebar } from "@/components/ui/file-tree-sidebar";
import type { Idea, IdeaFile, IdeaStatus, IdeaPriority } from "@/features/idea/types";
import {
  getIdeaFile,
  createIdeaFile,
  updateIdeaFile,
  deleteIdeaFile,
  patchIdeaMeta,
} from "@/features/idea/fileApi";
import { MarkdownEditor } from "@/components/markdown/MarkdownEditor";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { SHEET_SIZE_CLASSES } from "@/constants/sheet";
import { cn } from "@/lib/utils";

interface IdeaDetailDialogProps {
  idea: Idea | null;
  onClose: () => void;
  onIdeaUpdated?: (idea: Idea) => void;
}

function Header({ idea }: { idea: Idea }) {
  return (
    <div className="flex gap-2 items-center">
      <Lightbulb className="size-5" />
      <span className="font-semibold">{idea.name}</span>
    </div>
  );
}

function Description({ idea }: { idea: Idea }) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <StatusBadge status={idea.meta.status} />
      <PriorityBadge priority={idea.meta.priority} />
      {idea.meta.tags.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 text-xs text-muted-foreground"
        >
          <Tag className="size-3" />
          {tag}
        </span>
      ))}
    </div>
  );
}

function MetaPanel({
  idea,
  onUpdate,
  disabled,
}: {
  idea: Idea;
  onUpdate: (updates: Partial<Idea['meta']>) => void;
  disabled?: boolean;
}) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [localMeta, setLocalMeta] = useState(idea.meta);
  const [tagsInput, setTagsInput] = useState("");
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setLocalMeta(idea.meta);
    setTagsInput(idea.meta.tags.join(", "));
  }, [idea.meta]);

  const handleUpdate = useCallback(async (updates: Partial<Idea['meta']>) => {
    setIsUpdating(true);

    try {
      await patchIdeaMeta(idea.name, {
        status: updates.status,
        priority: updates.priority,
        title: updates.title,
        tags: updates.tags,
      });
      setLocalMeta(prev => ({ ...prev, ...updates }));
      onUpdate(updates);
    } catch (err) {
      console.error("Failed to update meta:", err);
      setLocalMeta(idea.meta);
      setTagsInput(idea.meta.tags.join(", "));
      onUpdate(idea.meta);
    } finally {
      setIsUpdating(false);
    }
  }, [idea.name, idea.meta, onUpdate]);

  const handleStatusChange = (status: IdeaStatus) => {
    handleUpdate({ status });
  };

  const handlePriorityChange = (priority: IdeaPriority) => {
    handleUpdate({ priority });
  };

  const handleTagsChange = (value: string) => {
    setTagsInput(value);
    const tags = value.split(",").map(t => t.trim()).filter(Boolean);
    
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      handleUpdate({ tags });
    }, 500);
  };

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return (
    <div className="space-y-4 p-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Status</label>
        <Select
          value={localMeta.status}
          onValueChange={(value) => handleStatusChange(value as IdeaStatus)}
          disabled={disabled || isUpdating}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="in-progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Priority</label>
        <Select
          value={localMeta.priority}
          onValueChange={(value) => handlePriorityChange(value as IdeaPriority)}
          disabled={disabled || isUpdating}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Tags (comma separated)</label>
        <Input
          value={tagsInput}
          onChange={(e) => handleTagsChange(e.target.value)}
          disabled={disabled || isUpdating}
          placeholder="architecture, file-watcher, sync"
        />
      </div>

      {isUpdating && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="size-3 animate-spin" />
          Updating...
        </div>
      )}
    </div>
  );
}

export function IdeaDetailDialog({
  idea,
  onClose,
  onIdeaUpdated,
}: IdeaDetailDialogProps) {
  const [selectedFile, setSelectedFile] = useState<IdeaFile | null>(null);
  const [markdownBody, setMarkdownBody] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [localMeta, setLocalMeta] = useState<Idea['meta'] | null>(null);

  const loadFileContent = useCallback(async () => {
    if (!idea || !selectedFile) return;
    try {
      const file = await getIdeaFile(idea.folder, selectedFile.name);
      setMarkdownBody(file.content);
      setLocalMeta({
        title: file.meta.title || idea.name,
        tags: file.meta.tags || [],
        status: file.meta.status || 'draft',
        priority: file.meta.priority || 'medium',
        createdAt: file.meta.createdAt || new Date().toISOString(),
        updatedAt: file.meta.updatedAt || new Date().toISOString(),
      });
      setHasChanges(false);
    } catch (err) {
      console.error("Failed to load file:", err);
    }
  }, [idea, selectedFile]);

  useEffect(() => {
    if (idea?.files && idea.files.length > 0 && !selectedFile) {
      setSelectedFile(idea.files[0]);
    }
  }, [idea, selectedFile]);

  useEffect(() => {
    if (idea && selectedFile) {
      loadFileContent();
    }
  }, [idea, selectedFile, loadFileContent]);

  useEffect(() => {
    if (!idea) {
      setSelectedFile(null);
      setMarkdownBody("");
      setLocalMeta(null);
      setHasChanges(false);
      setIsSidebarOpen(true);
    }
  }, [idea]);

  const handleMetaUpdate = useCallback((updates: Partial<Idea['meta']>) => {
    if (!idea) return;
    const updatedIdea: Idea = {
      ...idea,
      meta: {
        ...idea.meta,
        ...updates,
      },
    };
    onIdeaUpdated?.(updatedIdea);
  }, [idea, onIdeaUpdated]);

  const handleContentChange = useCallback((content: string) => {
    setMarkdownBody(content);
    setHasChanges(true);
  }, []);

  const handleSave = async () => {
    if (!idea || !selectedFile || isSaving) return;
    setIsSaving(true);
    try {
      await updateIdeaFile(idea.folder, selectedFile.name, markdownBody);
      setHasChanges(false);
    } catch (err) {
      console.error("Failed to save file:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateFile = async (filename: string) => {
    if (!idea) return;
    try {
      await createIdeaFile(
        idea.folder,
        filename,
        `# ${filename.replace(".md", "")}\n\n`,
      );
      if (onIdeaUpdated) {
        onIdeaUpdated(idea);
      }
      setSelectedFile({
        name: filename,
        path: `${idea.folder}/${filename}`,
        size: 0,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error("Failed to create file:", err);
    }
  };

  const handleDeleteFile = async (filename: string) => {
    if (!idea) return;
    if (filename === "index.md") {
      alert("Cannot delete index.md");
      return;
    }
    try {
      await deleteIdeaFile(idea.folder, filename);
      if (selectedFile?.name === filename && idea.files.length > 1) {
        const nextFile = idea.files.find((f) => f.name !== filename);
        if (nextFile) setSelectedFile(nextFile);
      }
      if (onIdeaUpdated) {
        onIdeaUpdated(idea);
      }
    } catch (err) {
      console.error("Failed to delete file:", err);
    }
  };

  const handleSelectFile = (file: IdeaFile) => {
    if (hasChanges) {
      if (confirm("You have unsaved changes. Discard them?")) {
        setSelectedFile(file);
        setHasChanges(false);
      }
    } else {
      setSelectedFile(file);
    }
  };

  return (
    <Dialog open={!!idea} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className={cn("flex flex-col", SHEET_SIZE_CLASSES)}>
        <DialogHeader className="pb-3 border-b flex-none">
          <DialogTitle>{idea && <Header idea={idea} />}</DialogTitle>
          <DialogDescription asChild>
            {idea && <Description idea={idea} />}
          </DialogDescription>
        </DialogHeader>
        {idea && localMeta && (
          <ResizablePanelGroup orientation="horizontal" className="flex-1 h-full">
            {isSidebarOpen && (
              <>
                <ResizablePanel defaultSize={25} minSize={20} maxSize={40} className="h-full">
                  <FileTreeSidebar
                    files={idea.files}
                    selectedFile={selectedFile?.name ?? ""}
                    onSelectFile={handleSelectFile}
                    onCreateFile={handleCreateFile}
                    onDeleteFile={handleDeleteFile}
                    disabled={isSaving}
                  />
                </ResizablePanel>
                <ResizableHandle
                  withHandle
                  className="bg-transparent border-none"
                />
              </>
            )}
            <ResizablePanel defaultSize={isSidebarOpen ? 80 : 100} className="h-full flex flex-col">
              <div className="p-2 border-b flex items-center justify-between flex-none">
                <div className="flex items-center gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                      >
                        {isSidebarOpen ? (
                          <PanelLeftClose className="size-4" />
                        ) : (
                          <PanelLeft className="size-4" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {isSidebarOpen ? "Close sidebar" : "Open sidebar"}
                    </TooltipContent>
                  </Tooltip>
                  {selectedFile && (
                    <span className="text-sm font-medium">
                      {selectedFile.name}
                    </span>
                  )}
                </div>
                {hasChanges && (
                  <span className="text-xs text-muted-foreground">
                    {isSaving ? "Saving..." : "Unsaved changes"}
                  </span>
                )}
              </div>

              <div className="flex flex-1 overflow-hidden">
                {isSidebarOpen && (
                  <>
                    <div className="w-72 border-r overflow-auto">
                      <div className="p-3 border-b bg-muted/30">
                        <h3 className="font-semibold text-sm">Idea Settings</h3>
                      </div>
                      <MetaPanel
                        idea={idea}
                        onUpdate={handleMetaUpdate}
                        disabled={isSaving}
                      />
                    </div>
                    <ResizableHandle
                      withHandle
                      className="bg-transparent border-none"
                    />
                  </>
                )}

                <div className="flex-1 overflow-hidden">
                  <MarkdownEditor
                    content={markdownBody}
                    onChange={handleContentChange}
                    onSave={handleSave}
                    isSaving={isSaving}
                    hasChanges={hasChanges}
                    autoFocus={false}
                  />
                </div>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        )}
      </DialogContent>
    </Dialog>
  );
}
