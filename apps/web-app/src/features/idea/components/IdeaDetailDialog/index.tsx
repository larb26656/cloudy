import { Lightbulb, PanelLeftClose, PanelLeft, Loader2 } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileTreeSidebar } from "@/components/ui/file-tree-sidebar";
import {
  type Idea,
  type IdeaFile,
  type IdeaStatus,
  type IdeaPriority,
  type IdeaDetail,
  apiResponseToIdeaDetail,
} from "@/features/idea/types";
import { apiClient } from "@/lib/api";
import { MarkdownEditor } from "@/components/markdown/editor";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { SHEET_SIZE_CLASSES } from "@/constants/sheet";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/sonner";
import { useLoadingStore } from "@/stores/loadingStore";
import { SelectStatus } from "./SelectStatus";
import { SelectPriority } from "./SelectPriority";
import { TagList } from "./TagList";
import { Timestamps } from "./Timestamps";

export const CREATE_IDEA_ID = "__create__";

const ideaApi = apiClient.api.idea as any;

const MOCK_IDEA_DETAIL: IdeaDetail = {
  id: CREATE_IDEA_ID,
  name: "",
  path: "",
  content: "",
  files: [{ name: "index.md", path: "", size: 0 }],
  meta: { status: "draft", priority: "medium", tags: [] },
};

interface IdeaDetailDialogProps {
  ideaId: string | null;
  onClose: () => void;
  onIdeaUpdated?: (idea: IdeaDetail) => void;
  onIdeaCreated?: (idea: IdeaDetail) => void;
}

function EditableHeader({
  idea,
  onUpdate,
}: {
  idea: IdeaDetail;
  onUpdate: (updatedMeta: Idea["meta"]) => void;
}) {
  const [localName, setLocalName] = useState(idea.name);
  const [localStatus, setLocalStatus] = useState(idea.meta.status);
  const [localPriority, setLocalPriority] = useState(idea.meta.priority);
  const [localTags, setLocalTags] = useState(idea.meta.tags);

  useEffect(() => {
    console.log(idea.name);
    setLocalName(idea.name);
    setLocalStatus(idea.meta.status);
    setLocalPriority(idea.meta.priority);
    setLocalTags(idea.meta.tags);
  }, [idea.name, idea.meta.status, idea.meta.priority, idea.meta.tags]);

  const handleUpdate = async (updates: {
    title?: string;
    status?: IdeaStatus;
    priority?: IdeaPriority;
    tags?: string[];
  }) => {
    if (updates.title) setLocalName(updates.title);
    if (updates.status) setLocalStatus(updates.status);
    if (updates.priority) setLocalPriority(updates.priority);
    if (updates.tags) setLocalTags(updates.tags);

    if (!idea.path) {
      const now = new Date().toISOString();
      onUpdate({
        title: updates.title ?? localName,
        status: updates.status ?? localStatus,
        priority: updates.priority ?? localPriority,
        tags: updates.tags ?? localTags,
        createdAt: idea.meta.createdAt ?? now,
        updatedAt: now,
      });
      return;
    }

    try {
      const { data, error } = await ideaApi({ path: idea.path }).patch({
        status: updates.status,
        priority: updates.priority,
        title: updates.title,
        tags: updates.tags,
      });
      if (error) {
        throw new Error(
          typeof error.value === "string"
            ? error.value
            : error.value?.message || "Failed to update",
        );
      }
      const { createdAt, updatedAt, ...rest } = data!.meta;
      onUpdate({
        ...rest,
        createdAt: createdAt ? new Date(createdAt).toISOString() : undefined,
        updatedAt: updatedAt ? new Date(updatedAt).toISOString() : undefined,
      });
    } catch (err) {
      console.error("Failed to update:", err);
      setLocalName(idea.name);
      setLocalStatus(idea.meta.status);
      setLocalPriority(idea.meta.priority);
      setLocalTags(idea.meta.tags);
    }
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLSpanElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      e.currentTarget.blur();
    }
  };

  const handleTitleBlur = (e: React.FocusEvent<HTMLSpanElement>) => {
    const newTitle = e.currentTarget.textContent?.trim();
    if (newTitle && newTitle !== idea.name) {
      handleUpdate({ title: newTitle });
    } else {
      e.currentTarget.textContent = localName;
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2 items-center">
        <Lightbulb className="size-5" />
        <span
          contentEditable
          suppressContentEditableWarning
          onKeyDown={handleTitleKeyDown}
          onBlur={handleTitleBlur}
          className="font-semibold outline-none focus:ring-2 focus:ring-ring rounded px-1 cursor-text"
        >
          {localName}
        </span>
      </div>
      <div className="flex items-center justify-start md:justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-1">
          <SelectStatus
            value={localStatus}
            onValueChange={(value) => handleUpdate({ status: value })}
          />
          <SelectPriority
            value={localPriority}
            onValueChange={(value) => handleUpdate({ priority: value })}
          />
        </div>

        <Timestamps
          createdAt={idea.meta.createdAt}
          updatedAt={idea.meta.updatedAt}
        />
      </div>

      <TagList
        tags={localTags}
        onAddTag={(tag) => handleUpdate({ tags: [...localTags, tag] })}
        onRemoveTag={(tag) =>
          handleUpdate({ tags: localTags.filter((t) => t !== tag) })
        }
      />
    </div>
  );
}

export function IdeaDetailDialog({
  ideaId,
  onClose,
  onIdeaUpdated,
  onIdeaCreated,
}: IdeaDetailDialogProps) {
  const [idea, setIdea] = useState<IdeaDetail | null>(null);
  const [isLoadingIdea, setIsLoadingIdea] = useState(false);
  const [selectedFile, setSelectedFile] = useState<IdeaFile | null>(null);
  const [markdownBody, setMarkdownBody] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [editorView, setEditorView] = useState<"preview" | "wysiwyg">(
    "preview",
  );
  const { showLoader, hideLoader } = useLoadingStore();
  const [deleteFileConfirm, setDeleteFileConfirm] = useState<{
    name: string;
  } | null>(null);

  const loadIdea = useCallback(async () => {
    if (!ideaId) return;

    if (ideaId === CREATE_IDEA_ID) {
      const now = new Date().toISOString();
      const mockIdea: IdeaDetail = {
        ...MOCK_IDEA_DETAIL,
        meta: { ...MOCK_IDEA_DETAIL.meta, createdAt: now, updatedAt: now },
      };
      setIdea(mockIdea);
      setSelectedFile(mockIdea.files[0] ?? null);
      setMarkdownBody("");
      setIsLoadingIdea(false);
      return;
    }

    setIsLoadingIdea(true);
    try {
      const { data, error } = await ideaApi[ideaId].get();
      if (error) {
        throw new Error(
          typeof error.value === "string"
            ? error.value
            : error.value?.message || "Failed to load idea",
        );
      }
      setIdea(apiResponseToIdeaDetail(data));
    } catch (err) {
      console.error("Failed to load idea:", err);
    } finally {
      setIsLoadingIdea(false);
    }
  }, [ideaId]);

  useEffect(() => {
    if (ideaId) {
      loadIdea();
    } else {
      setIdea(null);
    }
  }, [ideaId, loadIdea]);

  const loadFileContent = useCallback(async () => {
    if (!idea || !selectedFile || !idea.path) return;
    try {
      const { data, error } =
        await ideaApi.idea[idea.path].files[selectedFile.name].get();
      if (error) {
        throw new Error(
          typeof error.value === "string"
            ? error.value
            : error.value?.message || "Failed to load file",
        );
      }

      setMarkdownBody(data.content);
      setHasChanges(false);
    } catch (err) {
      console.error("Failed to load file:", err);
    }
  }, [idea, selectedFile]);

  useEffect(() => {
    if (idea?.files && idea.files.length > 0 && !selectedFile) {
      setSelectedFile(idea.files[0] ?? null);
    }
  }, [idea, selectedFile]);

  useEffect(() => {
    if (idea && selectedFile && idea.path) {
      loadFileContent();
    }
  }, [idea, selectedFile, loadFileContent]);

  useEffect(() => {
    console.log(idea);
    if (!idea) {
      setSelectedFile(null);
      setMarkdownBody("");
      setHasChanges(false);
      setIsSidebarOpen(true);
    }
  }, [idea]);

  const handleMetaUpdate = useCallback(
    (updatedMeta: Idea["meta"]) => {
      if (!idea) return;
      setIdea({
        ...idea,
        name: updatedMeta.title ?? idea.name,
        meta: updatedMeta,
      });
      if (idea.path) {
        onIdeaUpdated?.({
          ...idea,
          name: updatedMeta.title ?? idea.name,
          meta: updatedMeta,
        });
      }
    },
    [idea, onIdeaUpdated],
  );

  const handleSave = async (content: string) => {
    if (!idea || isSaving) return;
    setIsSaving(true);
    try {
      if (!idea.path) {
        // add idea
        const { data, error } = await ideaApi.post({
          title: idea.name || undefined,
          status: idea.meta.status,
          priority: idea.meta.priority,
          tags: idea.meta.tags,
          content,
        });
        if (error) {
          throw new Error(
            typeof error.value === "string"
              ? error.value
              : error.value?.message || "Failed to create idea",
          );
        }
        const created = apiResponseToIdeaDetail(data);
        setIdea(created);
        setMarkdownBody(content);
        setHasChanges(false);
        onIdeaCreated?.(created);
        return;
      }

      if (!selectedFile) return;

      // edit idea
      const { error } = await ideaApi.idea[idea.path].files[
        selectedFile.name
      ].put({ content });
      if (error) {
        throw new Error(
          typeof error.value === "string"
            ? error.value
            : error.value?.message || "Failed to save file",
        );
      }

      setMarkdownBody(content);
      setHasChanges(false);
    } catch (err) {
      console.error("Failed to save:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateFile = async (filename: string) => {
    if (!idea?.path) return;
    const newFile: IdeaFile = {
      name: filename,
      path: `${idea.path}/${filename}`,
      size: 0,
      updatedAt: new Date().toISOString(),
    };
    const prevFiles = idea.files;
    setIdea({ ...idea, files: [...idea.files, newFile] });
    setSelectedFile(newFile);
    try {
      const { error } = await ideaApi.idea[idea.path].files.post({
        filename,
        content: `# ${filename.replace(".md", "")}\n\n`,
      });
      if (error) {
        throw new Error(
          typeof error.value === "string"
            ? error.value
            : error.value?.message || "Failed to create file",
        );
      }
      if (onIdeaUpdated) {
        onIdeaUpdated({ ...idea, files: [...prevFiles, newFile] });
      }
    } catch (err) {
      setIdea({ ...idea, files: prevFiles });
      toast.error(
        err instanceof Error ? err.message : "Failed to create file",
      );
    }
  };

  const handleDeleteFile = async (filename: string) => {
    if (!idea?.path) return;
    if (filename === "index.md") {
      toast.error("Cannot delete index.md");
      return;
    }
    setDeleteFileConfirm({ name: filename });
  };

  const confirmDeleteFile = useCallback(async () => {
    if (!deleteFileConfirm || !idea?.path) return;
    const filename = deleteFileConfirm.name;
    const prevFiles = idea.files;
    const updatedFiles = prevFiles.filter((f) => f.name !== filename);
    setIdea({ ...idea, files: updatedFiles });
    if (selectedFile?.name === filename) {
      const nextFile = updatedFiles[0] ?? null;
      setSelectedFile(nextFile);
    }
    showLoader();
    try {
      const { error } = await ideaApi.idea[idea.path].files[filename].delete();
      if (error) {
        throw new Error(
          typeof error.value === "string"
            ? error.value
            : error.value?.message || "Failed to delete file",
        );
      }
      if (onIdeaUpdated) {
        onIdeaUpdated({ ...idea, files: updatedFiles });
      }
    } catch (err) {
      setIdea({ ...idea, files: prevFiles });
      if (selectedFile?.name === filename) {
        setSelectedFile(
          prevFiles.find((f) => f.name === filename) ?? prevFiles[0] ?? null,
        );
      }
      toast.error(err instanceof Error ? err.message : "Failed to delete file");
    } finally {
      hideLoader();
      setDeleteFileConfirm(null);
    }
  }, [
    deleteFileConfirm,
    idea,
    selectedFile,
    onIdeaUpdated,
    showLoader,
    hideLoader,
  ]);

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

  const hasNoPath = idea !== null && !idea.path;

  return (
    <Dialog open={!!ideaId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className={cn("flex flex-col p-0 gap-0", SHEET_SIZE_CLASSES)}
      >
        <DialogHeader className="p-4 pb-3 border-b flex-none">
          {isLoadingIdea ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              <span className="text-sm"> Loading...</span>
            </div>
          ) : idea ? (
            <EditableHeader idea={idea} onUpdate={handleMetaUpdate} />
          ) : null}
        </DialogHeader>
        {idea && (
          <div className="p-2 border-b flex justify-between items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsSidebarOpen((prev) => !prev)}
                  className="h-8 w-8 p-0"
                >
                  {isSidebarOpen ? (
                    <PanelLeftClose className="size-4" />
                  ) : (
                    <PanelLeft className="size-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {isSidebarOpen ? "Hide sidebar" : "Show sidebar"}
              </TooltipContent>
            </Tooltip>

            <Tabs
              value={editorView}
              onValueChange={(v) => setEditorView(v as "preview" | "wysiwyg")}
            >
              <TabsList>
                <TabsTrigger value="preview"> Preview </TabsTrigger>
                <TabsTrigger value="wysiwyg"> Edit </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        )}
        {!isLoadingIdea && idea && (
          <ResizablePanelGroup orientation="horizontal" className="flex-1">
            {isSidebarOpen && (
              <ResizablePanel defaultSize="30%">
                <FileTreeSidebar
                  files={idea.files}
                  selectedFile={selectedFile?.name ?? ""}
                  onSelectFile={handleSelectFile}
                  onCreateFile={handleCreateFile}
                  onDeleteFile={handleDeleteFile}
                  disabled={isSaving || hasNoPath}
                />
              </ResizablePanel>
            )}
            {isSidebarOpen && <ResizableHandle withHandle />}
            <ResizablePanel defaultSize={isSidebarOpen ? "70%" : "100%"}>
              <MarkdownEditor
                content={markdownBody}
                onSave={handleSave}
                isSaving={isSaving}
                hasChanges={hasChanges}
                autoFocus={false}
                view={editorView}
              />
            </ResizablePanel>
          </ResizablePanelGroup>
        )}
      </DialogContent>
      <DeleteConfirmDialog
        item={
          deleteFileConfirm
            ? { id: deleteFileConfirm.name, name: deleteFileConfirm.name }
            : null
        }
        onConfirm={confirmDeleteFile}
        onCancel={() => setDeleteFileConfirm(null)}
      />
    </Dialog>
  );
}
