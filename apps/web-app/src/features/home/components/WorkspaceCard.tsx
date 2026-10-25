import { ChevronRight, Folder } from "lucide-react";
import type { Workspace } from "@/lib/cloudy/workspaces";
import { ClickableCard } from "./ClickableCard";

interface WorkspaceCardProps {
  workspace: Workspace;
  sessionCount?: number;
  onClick: () => void;
}

export function WorkspaceCard({
  workspace,
  sessionCount,
  onClick,
}: WorkspaceCardProps) {
  return (
    <ClickableCard
      onClick={onClick}
      className="group flex min-h-20 items-center gap-4 p-2.5 sm:px-3"
    >
      <span
        className="flex size-12 shrink-0 items-center justify-center rounded-xl text-lg font-bold text-white"
        style={{ backgroundColor: workspace.color }}
      >
        {workspace.name.charAt(0).toUpperCase()}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-1.5">
        <span className="truncate text-sm font-medium">{workspace.name}</span>
        <span className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
          <Folder className="size-4 shrink-0" aria-hidden="true" />
          <span className="truncate">{workspace.directory}</span>
        </span>
        {sessionCount !== undefined && (
          <span className="text-xs text-muted-foreground">
            {sessionCount} session{sessionCount === 1 ? "" : "s"}
          </span>
        )}
      </span>
      <ChevronRight className="size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </ClickableCard>
  );
}
