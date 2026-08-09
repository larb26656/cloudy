import { useEffect, useState } from "react";
import { PanelLeft, PanelLeftClose } from "lucide-react";
import { useDeviceType } from "@/hooks";
import { Button } from "@/components/ui/button";
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

interface FilesSearchProps {
  directory: string;
}

export function FilesSearch({ directory }: FilesSearchProps) {
  const { isMobile, isTablet } = useDeviceType();
  const isSmallScreen = isMobile || isTablet;
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedPath, setSelectedPath] = useState<string | null>(null);

  useEffect(() => {
    setSelectedPath(null);
    setQuery("");
  }, [directory]);

  const handleSelect = (path: string) => {
    setSelectedPath(path);
    if (isSmallScreen) {
      setIsSidebarOpen(false);
    }
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
      {!isSmallScreen && (
        <div className="flex w-[300px] shrink-0 flex-col border-r">
          {sidebarHeader}
          {sidebarBody}
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        {(selectedPath || isSmallScreen) && (
          <div className="flex items-center gap-2 border-b px-4 py-2.5">
            {isSmallScreen && (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setIsSidebarOpen((prev) => !prev)}
                title={isSidebarOpen ? "Hide search" : "Show search"}
              >
                {isSidebarOpen ? (
                  <PanelLeftClose className="size-4" />
                ) : (
                  <PanelLeft className="size-4" />
                )}
              </Button>
            )}
            {selectedPath && (
              <PathText
                path={selectedPath}
                className="min-w-0 flex-1 font-mono text-sm"
              />
            )}
          </div>
        )}
        <div className="min-h-0 min-w-0 flex-1">
          <FilePreview directory={directory} path={selectedPath} />
        </div>
      </div>

      {isSmallScreen && (
        <Sheet
          open={isSidebarOpen}
          onOpenChange={setIsSidebarOpen}
          modal={false}
        >
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
      )}
    </div>
  );
}
