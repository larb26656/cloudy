import type { RecentChatSession } from "@/types";
import { useState } from "react";
import { formatRelativeFromTimestamp } from "@/lib/format";
import { cn } from "@repo/ui/lib/utils";
import { WorkspaceBadge } from "@/components/workspace/WorkspaceBadge";
import { SessionTitleInput } from "@/components/session/SessionTitleInput";
import { ProviderIcon } from "@/components/provider/ProviderIcon";

interface SessionRowProps {
  session: RecentChatSession;
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
  const [isEditing, setIsEditing] = useState(false);

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-xl border border-transparent bg-card px-3.5 py-3 text-left",
        "transition-colors hover:border-foreground/15",
      )}
    >
      <span className="flex min-w-0 flex-1 flex-col justify-start gap-2">
        <div className="flex items-center gap-2">
          <ProviderIcon providerId={session.providerId} />
          <div className="flex-1 truncate">
            {isEditing ? (
              <SessionTitleInput
                sessionId={session.id}
                directory={directory}
                initialTitle={session.title || "New Chat"}
                onDone={() => setIsEditing(false)}
              />
            ) : (
              <span
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  setIsEditing(true);
                }}
                className="text-[13.5px] font-medium"
              >
                {session.title || "New Chat"}
              </span>
            )}
          </div>
          <span className="shrink-0 text-[11px] text-muted-foreground/80">
            {formatRelativeFromTimestamp(session.updatedAt)}
          </span>
        </div>

        <span
          className="truncate text-[11px] text-muted-foreground/70"
          title={directory}
        >
          {directory}
        </span>

        <WorkspaceBadge
          workspaceName={workspaceName}
          directory={directory}
          workspaceId={workspaceId}
          className="self-start"
        />
      </span>
    </button>
  );
}
