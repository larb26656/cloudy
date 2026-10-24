import type { RecentChatSession } from "@/types";
import { useState } from "react";
import { formatRelativeFromTimestamp } from "@/lib/format";
import { SessionTitleInput } from "@/components/session/SessionTitleInput";
import { basename } from "@/lib/path";
import type { AgentAvatarRecipe } from "@/components/agent-avatar/AgentAvatar";
import { KindIcon } from "./KindIcon";

export type ConversationKind = "ask" | "agent" | "bot";

interface SessionCardProps {
  session: RecentChatSession;
  directory: string;
  kind: ConversationKind;
  avatar?: AgentAvatarRecipe;
  onClick: () => void;
}

function formatProvider(providerId: string): string {
  return providerId.charAt(0).toUpperCase() + providerId.slice(1);
}

export function SessionCard({
  session,
  directory,
  kind,
  avatar,
  onClick,
}: SessionCardProps) {
  const [isEditing, setIsEditing] = useState(false);

  const metaParts = [
    kind === "agent" ? "Agent" : kind === "bot" ? "Bot" : "Ask",
    formatProvider(session.providerId),
  ];
  if (kind === "agent") metaParts.push(basename(directory) || directory);
  const meta = metaParts.join(" · ");

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-4 rounded-xl p-3 text-left transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border bg-card text-muted-foreground">
        <KindIcon avatar={avatar} providerId={session.providerId} />
      </div>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
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
            className="truncate text-sm font-medium"
          >
            {session.title || "New Chat"}
          </span>
        )}
        <span
          className="truncate text-xs text-muted-foreground"
          title={directory}
        >
          {meta}
        </span>
      </span>
      <span className="shrink-0 text-xs text-muted-foreground">
        {formatRelativeFromTimestamp(session.updatedAt)}
      </span>
    </button>
  );
}
