import { ChevronRight, Folder } from "lucide-react";
import type { Workspace } from "@/lib/cloudy/workspaces";
import { ClickableCard } from "./ClickableCard";

interface WorkspaceCardProps {
  workspace: Workspace;
  sessionCount?: number;
  compact?: boolean;
  onClick: () => void;
}

export function WorkspaceCard({
  workspace,
  sessionCount,
  compact = false,
  onClick,
}: WorkspaceCardProps) {
  return (
    <ClickableCard
      onClick={onClick}
      className={
        compact
          ? "group flex min-h-10 items-center gap-2 rounded-lg border-transparent bg-muted/50 px-2 py-1.5 hover:bg-muted"
          : "group flex min-h-20 items-center gap-4 p-2.5 sm:px-3"
      }
    >
      <span
        className={`flex shrink-0 items-center justify-center text-white ${compact ? "size-7 rounded-md" : "size-12 rounded-xl text-lg font-bold"}`}
        style={{ backgroundColor: workspace.color }}
      >
        {compact ? (
          <Folder className="size-4" />
        ) : (
          workspace.name.charAt(0).toUpperCase()
        )}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-1.5">
        <span className="truncate text-sm font-medium">{workspace.name}</span>
        {!compact && (
          <span className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
            <Folder className="size-4 shrink-0" aria-hidden="true" />
            <span className="truncate">{workspace.directory}</span>
          </span>
        )}
        {sessionCount !== undefined && (
          <span className="text-xs text-muted-foreground">
            {sessionCount} session{sessionCount === 1 ? "" : "s"}
          </span>
        )}
      </span>
      <ChevronRight
        className={`shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 ${compact ? "size-4" : "size-5"}`}
      />
    </ClickableCard>
  );
}
