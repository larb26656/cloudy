import type { Workspace } from "@/lib/cloudy/workspaces";
import { cn } from "@/lib/utils";

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
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-xl border bg-card p-3.5 text-left",
        "transition-colors hover:border-foreground/20",
      )}
    >
      <span
        className="flex size-9 shrink-0 items-center justify-center rounded-[10px] text-[15px] font-bold text-white"
        style={{ backgroundColor: workspace.color }}
      >
        {workspace.name.charAt(0).toUpperCase()}
      </span>
      <span className="flex min-w-0 flex-col">
        <span className="truncate text-sm font-semibold">{workspace.name}</span>
        <span className="mt-0.5 text-[11.5px] text-muted-foreground/80 wrap-anywhere">
          {sessionCount !== undefined
            ? `${sessionCount} session${sessionCount === 1 ? "" : "s"}`
            : workspace.directory}
        </span>
      </span>
    </button>
  );
}
