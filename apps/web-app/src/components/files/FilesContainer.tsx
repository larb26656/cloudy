import { useState } from "react";
import { FileDiff, FolderOpen, Search } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FilesChanges } from "./FilesChanges";
import { FilesExplorer } from "./FilesExplorer";
import { FilesSearch } from "./FilesSearch";

type FilesMode = "changes" | "explorer" | "search";

interface FilesContainerProps {
  directory: string;
}

export function FilesContainer({ directory }: FilesContainerProps) {
  const [mode, setMode] = useState<FilesMode>("changes");

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center px-3 py-2">
        <Tabs value={mode} onValueChange={(v) => setMode(v as FilesMode)}>
          <TabsList>
            <TabsTrigger value="changes">
              <FileDiff className="size-3.5" />
              Changes
            </TabsTrigger>
            <TabsTrigger value="explorer">
              <FolderOpen className="size-3.5" />
              Explorer
            </TabsTrigger>
            <TabsTrigger value="search">
              <Search className="size-3.5" />
              Search
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      <div className="min-h-0 flex-1">
        {mode === "changes" ? (
          <FilesChanges directory={directory} />
        ) : mode === "explorer" ? (
          <FilesExplorer directory={directory} />
        ) : (
          <FilesSearch directory={directory} />
        )}
      </div>
    </div>
  );
}
