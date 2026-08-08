import type { SessionV2Info } from "@opencode-ai/sdk/v2";
import { formatRelativeFromTimestamp } from "@/lib/format";
import { cn } from "@/lib/utils";
import { WorkspaceBadge } from "@/components/workspace/WorkspaceBadge";

interface SessionRowProps {
  session: SessionV2Info;
  workspaceName?: string;
  /** Filesystem path of the session. Used to show a fallback indicator when
   * the session has no matching cloudy workspace. */
  directory: string;
  /** When provided, a colored WorkspaceDot is shown before the name. */
  workspaceId?: string;
  onClick: () => void;
}

export function SessionRow({
  session,
  workspaceName,
  directory,
  workspaceId,
  onClick,
}: SessionRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-xl border border-transparent bg-card px-3.5 py-3 text-left",
        "transition-colors hover:border-foreground/15",
      )}
    >
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-[13.5px] font-medium">
          {session.title || "New Chat"}
        </span>
      </span>
      <WorkspaceBadge
        workspaceName={workspaceName}
        directory={directory}
        workspaceId={workspaceId}
      />
      <span className="shrink-0 text-[11px] text-muted-foreground/80">
        {formatRelativeFromTimestamp(session.time.updated)}
      </span>
    </button>
  );
}
