import { useNavigate } from "@tanstack/react-router";
import type { Session } from "@opencode-ai/sdk/v2";

import { Button } from "@/components/ui/button";
import { useSessionStore } from "@/stores/sessionStore";
import { useTabStore } from "@/stores/tabStore";
import { useSessions, useCreateSession } from "@/hooks/queries";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

function SessionList({
  directory,
  workspaceId,
}: {
  directory: string;
  workspaceId: string;
}) {
  const navigate = useNavigate();
  const { data: sessions = [], isLoading, error } = useSessions({ directory });
  const createSession = useCreateSession();
  const selectedSessionId = useSessionStore((s) => s.selectedSessionId);
  const selectSession = useSessionStore((s) => s.selectSession);
  const addTab = useTabStore((s) => s.addTab);

  const handleSelect = (session: Session) => {
    addTab({
      sessionId: session.id,
      workspaceId,
      sessionName: session.title || "New Chat",
    });
    selectSession(session.id);
    void navigate({ to: "/" });
  };

  const handleNewChat = () => {
    createSession.mutate(
      { directory },
      {
        onSuccess: (session) => {
          addTab({
            sessionId: session.id,
            workspaceId,
            sessionName: session.title || "New Chat",
          });
          selectSession(session.id);
          void navigate({ to: "/" });
        },
      },
    );
  };

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading sessions...</p>;
  }
  if (error) {
    return <p className="text-sm text-destructive">Failed to load sessions</p>;
  }

  const rootSessions = sessions.filter((session: Session) => !session.parentID);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto -mr-4 pr-4">
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
      {rootSessions.map((session: Session) => (
        <button
          key={session.id}
          type="button"
          onClick={() => handleSelect(session)}
          className={cn(
            "shrink-0 truncate rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted",
            session.id === selectedSessionId && "bg-muted font-medium",
          )}
        >
          {session.title || "New Chat"}
        </button>
      ))}
      {rootSessions.length === 0 && (
        <p className="px-2 py-1.5 text-sm text-muted-foreground">
          No sessions yet
        </p>
      )}
    </div>
  );
}

export { SessionList };
