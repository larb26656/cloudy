import { useState } from "react";
import {
  ChevronRight,
  File as FileIcon,
  Folder,
  FolderOpen,
} from "lucide-react";
import type { FileNode } from "@opencode-ai/sdk/v2";
import type { ReactNode } from "react";
import { useFileList } from "@/hooks/queries/useFiles";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { EmptyState } from "@/components/ui/empty-state";

interface FileTreeProps {
  directory: string;
  selectedPath: string | null;
  onSelect: (path: string) => void;
}

export function FileTree({ directory, selectedPath, onSelect }: FileTreeProps) {
  const { data, isLoading, error, refetch } = useFileList({
    directory,
    path: ".",
  });

  let content: ReactNode;
  if (isLoading) {
    content = (
      <LoadingState size="inline" title="Loading files..." spinner={false} />
    );
  } else if (error) {
    content = (
      <ErrorState
        size="inline"
        bare
        message={error.message}
        onRetry={() => refetch()}
      />
    );
  } else {
    const nodes = sortNodes((data ?? []).filter((n) => !n.ignored));
    if (nodes.length === 0) {
      content = <EmptyState size="inline" title="No files" />;
    } else {
      content = (
        <ul className="flex flex-col py-1">
          {nodes.map((node) => (
            <FileTreeNode
              key={node.path}
              node={node}
              directory={directory}
              level={0}
              selectedPath={selectedPath}
              onSelect={onSelect}
            />
          ))}
        </ul>
      );
    }
  }

  return <ScrollArea className="h-full">{content}</ScrollArea>;
}

interface FileTreeNodeProps {
  node: FileNode;
  directory: string;
  level: number;
  selectedPath: string | null;
  onSelect: (path: string) => void;
}

function FileTreeNode({
  node,
  directory,
  level,
  selectedPath,
  onSelect,
}: FileTreeNodeProps) {
  const [expanded, setExpanded] = useState(false);
  const isSelected = node.path === selectedPath;
  const isDirectory = node.type === "directory";
  const padding = { paddingLeft: `${level * 12 + 8}px` };

  const handleClick = () => {
    if (isDirectory) {
      setExpanded((prev) => !prev);
    } else {
      onSelect(node.path);
    }
  };

  return (
    <li>
      <button
        onClick={handleClick}
        style={padding}
        className={cn(
          "flex w-full items-center gap-1.5 py-1 pr-2 text-left text-sm transition-colors",
          isSelected
            ? "bg-muted text-foreground"
            : "hover:bg-muted/50 text-muted-foreground",
        )}
      >
        {isDirectory ? (
          <>
            <ChevronRight
              data-icon
              className={cn(
                "size-3.5 shrink-0 text-muted-foreground transition-transform",
                expanded && "rotate-90",
              )}
            />
            {expanded ? (
              <FolderOpen
                data-icon
                className="size-4 shrink-0 text-muted-foreground"
              />
            ) : (
              <Folder
                data-icon
                className="size-4 shrink-0 text-muted-foreground"
              />
            )}
          </>
        ) : (
          <>
            <span className="size-3.5 shrink-0" />
            <FileIcon
              data-icon
              className="size-4 shrink-0 text-muted-foreground"
            />
          </>
        )}
        <span className="min-w-0 flex-1 truncate font-mono text-xs">
          {node.name}
        </span>
      </button>

      {isDirectory && expanded && (
        <FileTreeChildren
          directory={directory}
          parentPath={node.path}
          level={level + 1}
          selectedPath={selectedPath}
          onSelect={onSelect}
        />
      )}
    </li>
  );
}

interface FileTreeChildrenProps {
  directory: string;
  parentPath: string;
  level: number;
  selectedPath: string | null;
  onSelect: (path: string) => void;
}

function FileTreeChildren({
  directory,
  parentPath,
  level,
  selectedPath,
  onSelect,
}: FileTreeChildrenProps) {
  const { data, isLoading, error } = useFileList({
    directory,
    path: parentPath,
  });

  if (isLoading) {
    return <LoadingState size="inline" title={null} className="py-1" />;
  }
  if (error) {
    return (
      <ErrorState
        size="inline"
        bare
        message="Failed to load"
        className="py-1"
      />
    );
  }

  const nodes = sortNodes((data ?? []).filter((n) => !n.ignored));
  if (nodes.length === 0) return null;

  return (
    <ul className="flex flex-col">
      {nodes.map((node) => (
        <FileTreeNode
          key={node.path}
          node={node}
          directory={directory}
          level={level}
          selectedPath={selectedPath}
          onSelect={onSelect}
        />
      ))}
    </ul>
  );
}

function sortNodes(nodes: FileNode[]): FileNode[] {
  return [...nodes].sort((a, b) => {
    if (a.type !== b.type) {
      return a.type === "directory" ? -1 : 1;
    }
    return a.name.localeCompare(b.name);
  });
}
