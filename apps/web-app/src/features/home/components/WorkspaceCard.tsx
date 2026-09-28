import type { Workspace } from "@/lib/cloudy/workspaces";
import { BotEyeIcon } from "./BotEyeIcon";
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
    <ClickableCard onClick={onClick} className="flex items-center gap-3 p-3.5">
      <span
        className="flex size-9 shrink-0 items-center justify-center rounded-[10px] text-[15px] font-bold text-white"
        style={{ backgroundColor: workspace.color }}
      >
        {workspace.type === "bot" ? (
          <BotEyeIcon className="size-[18px]" />
        ) : (
          workspace.name.charAt(0).toUpperCase()
        )}
      </span>
      <span className="flex min-w-0 flex-col">
        <span className="truncate text-sm font-semibold">{workspace.name}</span>
        <span className="mt-0.5 text-[11.5px] text-muted-foreground/80 wrap-anywhere">
          {sessionCount !== undefined
            ? `${sessionCount} session${sessionCount === 1 ? "" : "s"}`
            : workspace.directory}
        </span>
      </span>
    </ClickableCard>
  );
}
