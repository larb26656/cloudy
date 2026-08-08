import { Folder } from "lucide-react";
import { cn } from "@/lib/utils";
import { WorkspaceDot } from "./WorkspaceDot";

interface WorkspaceBadgeProps {
  /** Workspace display name. When provided, shows a name pill.
   * When omitted, falls back to a folder icon + directory basename. */
  workspaceName?: string;
  /** Filesystem path. Used for the fallback badge and as the tooltip. */
  directory: string;
  /** When provided, a colored WorkspaceDot is shown before the name. */
  workspaceId?: string;
  className?: string;
}

function basename(path: string): string {
  const trimmed = path.replace(/\/+$/, "");
  const idx = trimmed.lastIndexOf("/");
  return idx >= 0 ? trimmed.slice(idx + 1) : trimmed;
}

export function WorkspaceBadge({
  workspaceName,
  directory,
  workspaceId,
  className,
}: WorkspaceBadgeProps) {
  if (workspaceName) {
    return (
      <span
        className={cn(
          "flex shrink-0 items-center gap-1 rounded-full border bg-muted px-2 py-0.5 text-[10.5px] text-muted-foreground",
          className,
        )}
      >
        {workspaceId && <WorkspaceDot workspaceId={workspaceId} />}
        {workspaceName}
      </span>
    );
  }

  return (
    <span
      className={cn(
        "flex shrink-0 items-center gap-1 rounded-full border bg-muted/50 px-2 py-0.5 text-[10.5px] text-muted-foreground/80",
        className,
      )}
      title={directory}
    >
      <Folder className="size-3" data-icon="inline_start" />
      {basename(directory) || "unregistered"}
    </span>
  );
}
