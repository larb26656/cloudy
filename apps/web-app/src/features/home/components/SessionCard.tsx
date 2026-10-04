import type { RecentChatSession } from "@/types";
import { useState } from "react";
import { formatRelativeFromTimestamp } from "@/lib/format";
import { SessionTitleInput } from "@/components/session/SessionTitleInput";
import { ProviderIcon } from "@/components/provider/ProviderIcon";
import { ClickableCard } from "./ClickableCard";

interface SessionCardProps {
  session: RecentChatSession;
  directory: string;
  onClick: () => void;
}

export function SessionCard({ session, directory, onClick }: SessionCardProps) {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <ClickableCard
      onClick={onClick}
      className="flex items-center gap-1 px-3.5 py-3"
    >
      <span className="flex min-w-0 flex-1 flex-col justify-start gap-1">
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
      </span>
    </ClickableCard>
  );
}
