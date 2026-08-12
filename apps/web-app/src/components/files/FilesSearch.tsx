import { useEffect, useState } from "react";
import { PathText } from "@/components/ui/path-text";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { FileSearchInput } from "./FileSearchInput";
import { FileSearchResults } from "./FileSearchResults";
import { FilePreview } from "./FilePreview";
import { FilesResponsiveHeader } from "./FilesResponsiveHeader";

interface FilesSearchProps {
  directory: string;
}

export function FilesSearch({ directory }: FilesSearchProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedPath, setSelectedPath] = useState<string | null>(null);

  useEffect(() => {
    setSelectedPath(null);
    setQuery("");
  }, [directory]);

  const handleSelect = (path: string) => {
    setSelectedPath(path);
    setIsSidebarOpen(false);
  };

  const sidebarHeader = <FileSearchInput value={query} onChange={setQuery} />;

  const sidebarBody = (
    <div className="min-h-0 flex-1">
      <FileSearchResults
        directory={directory}
        query={query}
        selectedPath={selectedPath}
        onSelect={handleSelect}
      />
    </div>
  );

  return (
    <div className="flex h-full">
      <div className="hidden @files:flex w-[300px] shrink-0 flex-col border-r">
        {sidebarHeader}
        {sidebarBody}
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <FilesResponsiveHeader
          hasSelection={Boolean(selectedPath)}
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
          openTitle="Show search"
          closeTitle="Hide search"
        >
          {selectedPath && (
            <PathText
              path={selectedPath}
              className="min-w-0 flex-1 font-mono text-sm"
            />
          )}
        </FilesResponsiveHeader>
        <div className="min-h-0 min-w-0 flex-1">
          <FilePreview directory={directory} path={selectedPath} />
        </div>
      </div>

      <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen} modal={false}>
        <SheetContent
          side="left"
          className="w-[280px] gap-0 p-0 sm:w-[320px]"
          showCloseButton={false}
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Search</SheetTitle>
          </SheetHeader>
          {sidebarHeader}
          {sidebarBody}
        </SheetContent>
      </Sheet>
    </div>
  );
}
