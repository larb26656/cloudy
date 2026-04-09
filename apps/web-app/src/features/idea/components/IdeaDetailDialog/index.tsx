import {
  Lightbulb,
  PanelLeftClose,
  PanelLeft,
  Ellipsis,
  Link,
} from "lucide-react";
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
import { useDeviceType } from "@/hooks";
import { Skeleton } from "@/components/ui/skeleton";
import { SelectStatus } from "./SelectStatus";
import { SelectPriority } from "./SelectPriority";
import { TagList } from "./TagList";
import { Timestamps } from "./Timestamps";

export const CREATE_IDEA_ID = "__create__";

const ideaApi = apiClient.api.idea as any;

const MOCK_IDEA_DETAIL: IdeaDetail = {
  id: CREATE_IDEA_ID,
  name: "temp",
  path: "",
  content: "",
  files: [{ name: "index.md", path: "", size: 0 }],
  meta: { status: "draft", priority: "medium", tags: [] },
};

interface IdeaDetailViewProps {
  ideaId: string | null;
  onBack?: () => void;
  onIdeaUpdated?: (idea: IdeaDetail) => void;
  onIdeaCreated?: (idea: IdeaDetail) => void;
  viewOnly?: boolean;
}

function IdeaDetailSkeleton() {
  return (
    <>
      <div className="p-4 pb-3 border-b flex-none">
        <div className="flex flex-col gap-2">
          <div className="flex gap-2 mr-[32px]">
            <Skeleton className="size-5" />
            <Skeleton className="h-5 w-48" />
          </div>
          <div className="flex items-center gap-2 flex-1">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-24" />
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-32" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-6 w-16" />
            </div>
          </div>
        </div>
      </div>
      <div className="flex-1 flex flex-col p-4 gap-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-20" />
        </div>
        <div className="flex-1 flex gap-4">
          <Skeleton className="h-full w-[30%] rounded-lg" />
          <Skeleton className="h-full flex-1 rounded-lg" />
        </div>
      </div>
    </>
  );
}

function CopyLinkButton({ ideaId }: { ideaId: string }) {
  const handleCopyLink = useCallback(async () => {
    const url = `${window.location.origin}/ideas/${ideaId}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard");
    } catch {
      toast.error("Failed to copy link");
    }
  }, [ideaId]);

  return (
    <Tooltip>
      <TooltipTrigger
        onClick={handleCopyLink}
        className="h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-muted hover:text-foreground"
      >
        <Link className="size-4" />
      </TooltipTrigger>
      <TooltipContent>Copy link</TooltipContent>
    </Tooltip>
  );
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
  const [detailExpanded, setDetailExpanded] = useState(false);
  const { isMobile } = useDeviceType();

  useEffect(() => {
    console.log(idea.name);
    setLocalName(idea.name);
    setLocalStatus(idea.meta.status);
    setLocalPriority(idea.meta.priority);
    setLocalTags(idea.meta.tags);
  }, [idea.name, idea.meta.status, idea.meta.priority, idea.meta.tags]);

  const handleDetailToogle = () => {
    setDetailExpanded(!detailExpanded);
  };

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
      <div className="flex gap-2 mr-[32px]">
        <Lightbulb className="size-5 shrink-0" />
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

      {(!isMobile || detailExpanded) && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-start md:justify-between gap-2 flex-wrap">
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
      )}

      {isMobile && (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          title="Toggle detail"
          className="self-center h-[16px] w-full text-muted-foreground"
          onClick={handleDetailToogle}
        >
          <Ellipsis />
        </Button>
      )}
    </div>
  );
}

export function IdeaDetailView({
  ideaId,
  onBack,
  onIdeaUpdated,
  onIdeaCreated,
  viewOnly = false,
}: IdeaDetailViewProps) {
  const [idea, setIdea] = useState<IdeaDetail | null>(null);
  const [isLoadingIdea, setIsLoadingIdea] = useState(false);
  const [selectedFile, setSelectedFile] = useState<IdeaFile | null>(null);
  const [markdownBody, setMarkdownBody] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const { showLoader, hideLoader } = useLoadingStore();
  const { isMobile, isTablet } = useDeviceType();
  const isSmallScreen = isMobile || isTablet;
  const [isSidebarOpen, setIsSidebarOpen] = useState(!isSmallScreen);
  const [editorView, setEditorView] = useState<"preview" | "wysiwyg">(
    "preview",
  );
  const effectiveEditorView = viewOnly ? "preview" : editorView;
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
      setIsSidebarOpen(!isSmallScreen);
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
        const { data, error } = await ideaApi.post({
          title: idea.name,
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
      toast.error(err instanceof Error ? err.message : "Failed to create file");
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

  if (isLoadingIdea) {
    return <IdeaDetailSkeleton />;
  }

  if (!idea) {
    return null;
  }

  return (
    <div className={cn("flex flex-col p-0 gap-0", SHEET_SIZE_CLASSES)}>
      <DialogHeader className="p-4 pb-3 border-b flex-none">
        <EditableHeader idea={idea} onUpdate={handleMetaUpdate} />
      </DialogHeader>

      <div className="p-2 border-b flex justify-between items-center gap-1">
        <div className="flex items-center gap-1">
          {onBack && (
            <Tooltip>
              <TooltipTrigger
                onClick={onBack}
                className="h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-muted hover:text-foreground"
              >
                <PanelLeftClose className="size-4" />
              </TooltipTrigger>
              <TooltipContent>Back</TooltipContent>
            </Tooltip>
          )}
          <Tooltip>
            <TooltipTrigger
              onClick={() => setIsSidebarOpen((prev) => !prev)}
              className="h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground"
            >
              {isSidebarOpen ? (
                <PanelLeftClose className="size-4" />
              ) : (
                <PanelLeft className="size-4" />
              )}
            </TooltipTrigger>
            <TooltipContent>
              {isSidebarOpen ? "Hide sidebar" : "Show sidebar"}
            </TooltipContent>
          </Tooltip>
          {ideaId && ideaId !== CREATE_IDEA_ID && (
            <CopyLinkButton ideaId={ideaId} />
          )}
        </div>

        <Tabs
          value={editorView}
          onValueChange={(v) => setEditorView(v as "preview" | "wysiwyg")}
        >
          <TabsList>
            <TabsTrigger value="preview"> Preview </TabsTrigger>
            {!viewOnly && <TabsTrigger value="wysiwyg"> Edit </TabsTrigger>}
          </TabsList>
        </Tabs>
      </div>

      {isSmallScreen && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <MarkdownEditor
            content={markdownBody}
            onSave={handleSave}
            isSaving={isSaving}
            hasChanges={hasChanges}
            autoFocus={false}
            view={effectiveEditorView}
          />
        </div>
      )}

      {!isSmallScreen && (
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
                readOnly={viewOnly}
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
              view={effectiveEditorView}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      )}

      {isSmallScreen && (
        <Sheet
          open={isSidebarOpen}
          onOpenChange={setIsSidebarOpen}
          modal={false}
        >
          <SheetContent
            side="left"
            className="w-[280px] sm:w-[320px] p-0"
            showCloseButton={false}
          >
            <SheetHeader className="sr-only">
              <SheetTitle>Files</SheetTitle>
            </SheetHeader>
            <FileTreeSidebar
              files={idea.files}
              selectedFile={selectedFile?.name ?? ""}
              onSelectFile={(file) => {
                handleSelectFile(file);
                setIsSidebarOpen(false);
              }}
              onCreateFile={handleCreateFile}
              onDeleteFile={handleDeleteFile}
              disabled={isSaving || hasNoPath}
              readOnly={viewOnly}
            />
          </SheetContent>
        </Sheet>
      )}

      <DeleteConfirmDialog
        item={
          deleteFileConfirm
            ? { id: deleteFileConfirm.name, name: deleteFileConfirm.name }
            : null
        }
        onConfirm={confirmDeleteFile}
        onCancel={() => setDeleteFileConfirm(null)}
      />
    </div>
  );
}

interface IdeaDetailDialogProps {
  ideaId: string | null;
  onClose: () => void;
  onIdeaUpdated?: (idea: IdeaDetail) => void;
  onIdeaCreated?: (idea: IdeaDetail) => void;
}

export function IdeaDetailDialog({
  ideaId,
  onClose,
  onIdeaUpdated,
  onIdeaCreated,
}: IdeaDetailDialogProps) {
  return (
    <Dialog open={!!ideaId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className={cn("flex flex-col p-0 gap-0", SHEET_SIZE_CLASSES)}>
        <IdeaDetailView
          ideaId={ideaId}
          onIdeaUpdated={onIdeaUpdated}
          onIdeaCreated={onIdeaCreated}
        />
      </DialogContent>
    </Dialog>
  );
}
