import type { ReactNode } from "react";
import { useState } from "react";
import type { Session } from "@opencode-ai/sdk/v2";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { EmptyState } from "@/components/ui/empty-state";
import { SessionTitleInput } from "@/components/session/SessionTitleInput";
import { useTabStore } from "@/stores/tabStore";
import { useSessions, useCreateSession } from "@/hooks/queries";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface SessionListProps {
  directory: string;
  workspaceId: string;
  /** Optional custom header rendered above the list. When omitted, the default "New chat" button is shown. */
  header?: ReactNode;
}

function SessionList({ directory, workspaceId, header }: SessionListProps) {
  const { data: sessions = [], isLoading, error } = useSessions({ directory });
  const createSession = useCreateSession();
  const addTab = useTabStore((s) => s.addTab);
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleSelect = (session: Session) => {
    addTab("chat", {
      sessionId: session.id,
      workspaceId,
      directory,
      sessionName: session.title || "New Chat",
    });
  };

  const handleNewChat = () => {
    addTab("chat", {
      sessionId: null,
      workspaceId,
      directory,
      sessionName: "New Chat",
    });
  };

  if (isLoading) {
    return (
      <LoadingState size="inline" title="Loading sessions..." spinner={false} />
    );
  }
  if (error) {
    return <ErrorState size="inline" bare message="Failed to load sessions" />;
  }

  const rootSessions = sessions.filter((session: Session) => !session.parentID);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-1.5">
      {header ?? (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleNewChat}
          disabled={createSession.isPending}
          className="self-start gap-2"
        >
          <Plus data-icon="inline-start" />
          New chat
        </Button>
      )}
      {rootSessions.map((session: Session) =>
        editingId === session.id ? (
          <SessionTitleInput
            key={session.id}
            sessionId={session.id}
            directory={directory}
            initialTitle={session.title || "New Chat"}
            onDone={() => setEditingId(null)}
            className="px-2 py-1.5"
          />
        ) : (
          <button
            key={session.id}
            type="button"
            onClick={() => handleSelect(session)}
            onDoubleClick={(e) => {
              e.stopPropagation();
              setEditingId(session.id);
            }}
            className={cn(
              "shrink-0 truncate rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted",
            )}
          >
            {session.title || "New Chat"}
          </button>
        ),
      )}
      {rootSessions.length === 0 && (
        <EmptyState size="inline" title="No sessions yet" />
      )}
    </div>
  );
}

export { SessionList };
