import type { SessionV2Info } from "@opencode-ai/sdk/v2";
import { Folder } from "lucide-react";
import { formatRelativeFromTimestamp } from "@/lib/format";
import { cn } from "@/lib/utils";

interface SessionRowProps {
  session: SessionV2Info;
  workspaceName?: string;
  /** Filesystem path of the session. Used to show a fallback indicator when
   * the session has no matching cloudy workspace. */
  directory: string;
  onClick: () => void;
}

function basename(path: string): string {
  const trimmed = path.replace(/\/+$/, "");
  const idx = trimmed.lastIndexOf("/");
  return idx >= 0 ? trimmed.slice(idx + 1) : trimmed;
}

export function SessionRow({
  session,
  workspaceName,
  directory,
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
      {workspaceName ? (
        <span className="shrink-0 rounded-full border bg-muted px-2 py-0.5 text-[10.5px] text-muted-foreground">
          {workspaceName}
        </span>
      ) : (
        <span
          className="flex shrink-0 items-center gap-1 rounded-full border bg-muted/50 px-2 py-0.5 text-[10.5px] text-muted-foreground/80"
          title={directory}
        >
          <Folder className="size-3" data-icon="inline_start" />
          {basename(directory) || "unregistered"}
        </span>
      )}
      <span className="shrink-0 text-[11px] text-muted-foreground/80">
        {formatRelativeFromTimestamp(session.time.updated)}
      </span>
    </button>
  );
}
