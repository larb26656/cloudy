import { createTwoFilesPatch } from "diff";
import { PanelLeftClose, PanelLeft } from "lucide-react";
import { useState } from "react";
import { useDeviceType } from "@/hooks";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { FileListSidebar } from "./FileListSidebar";
import { CodeBlock } from "@/components/markdown/CodeBlock";
import { DiffViewer } from "@/components/markdown/DiffViewer";

export interface FileItem {
  name: string;
  path: string;
  content: string;
  originalContent?: string;
}

export interface FileUpdateViewerProps {
  files: FileItem[];
  selectedFile?: string;
  onSelectFile?: (file: FileItem) => void;
}

export function FileUpdateViewer({
  files,
  selectedFile: externalSelectedFile,
  onSelectFile: externalOnSelectFile,
}: FileUpdateViewerProps) {
  console.log(files);
  const { isMobile, isTablet } = useDeviceType();
  const isSmallScreen = isMobile || isTablet;
  const [isSidebarOpen, setIsSidebarOpen] = useState(!isSmallScreen);
  const [internalSelectedFile, setInternalSelectedFile] = useState(
    files[0]?.name,
  );

  const selectedFile = externalSelectedFile ?? internalSelectedFile;
  const currentFile = files.find((f) => f.name === selectedFile) ?? files[0];

  function shortenPath(path: string, maxLen = 40): string {
    if (path.length <= maxLen) return path;
    const parts = path.split("/");
    if (parts.length <= 2) return path;
    const filename = parts.pop()!;
    const first = parts.shift()!;
    return `${first}/…/${filename}`;
  }

  const handleSelectFile = (file: FileItem) => {
    setInternalSelectedFile(file.name);
    externalOnSelectFile?.(file);
    if (isSmallScreen) {
      setIsSidebarOpen(false);
    }
  };

  const renderContent = () => {
    if (!currentFile) {
      return (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          Select a file to view
        </div>
      );
    }

    const isEditMode = currentFile.originalContent !== undefined;
    const filePath = String(currentFile.name ?? "");
    const oldString = String(currentFile.originalContent ?? "");
    const newString = String(currentFile.content ?? "");

    if (isEditMode) {
      return (
        <DiffViewer
          diff={createTwoFilesPatch(filePath, filePath, oldString, newString)}
          fileNames={{ old: currentFile.name, new: currentFile.name }}
          inline={true}
          viewMode="line-by-line"
          showLineNumbers={true}
          headless
        />
      );
    }

    return <CodeBlock headless>{currentFile.content}</CodeBlock>;
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-2 border-b flex justify-between items-center gap-1">
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
      </div>

      {isSmallScreen && (
        <div className="flex-1 flex flex-col overflow-hidden bg-[#1e1e1e]">
          {renderContent()}
        </div>
      )}

      {!isSmallScreen && (
        <ResizablePanelGroup orientation="horizontal" className="flex-1">
          {isSidebarOpen && (
            <ResizablePanel defaultSize="30%">
              <FileListSidebar
                files={files}
                selectedFile={selectedFile}
                onSelectFile={handleSelectFile}
              />
            </ResizablePanel>
          )}
          {isSidebarOpen && <ResizableHandle withHandle />}
          <ResizablePanel defaultSize={isSidebarOpen ? "70%" : "100%"}>
            <div className="h-full flex flex-col overflow-auto bg-[#1e1e1e]">
              {currentFile && (
                <div className="px-3 py-1.5 text-xs text-muted-foreground border-b border-border/50 bg-[#1e1e1e]">
                  {shortenPath(currentFile.name)}
                </div>
              )}
              {renderContent()}
            </div>
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
            <FileListSidebar
              files={files}
              selectedFile={selectedFile}
              onSelectFile={handleSelectFile}
            />
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
}
