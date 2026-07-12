import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useSessions } from "@/hooks/queries";
import type { Session } from "@opencode-ai/sdk/v2";
import { SessionItem } from "./SessionItem";
import { useSessionStore } from "@/stores/sessionStore";

type SessionListProps = {
  searchQuery: string;
};

/**
 * @deprecated Unused - to be removed
 */
export function SessionList({ searchQuery }: SessionListProps) {
  const navigate = useNavigate();
  const { location } = useRouterState();
  const {
    data: sessions = [],
    isLoading,
    error,
  } = useSessions();
  const selectedSessionId = useSessionStore((s) => s.selectedSessionId);
  const selectSession = useSessionStore((s) => s.selectSession);

  const filteredSessions = sessions
    .filter((session: Session) => !session.parentID)
    .filter((session: Session) =>
      (session.title || "New Chat")
        .toLowerCase()
        .includes(searchQuery.toLowerCase()),
    );

  if (isLoading) {
    return (
      <div className="flex-1 p-2 min-h-0 overflow-y-auto">
        <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-center p-4">
          <p className="text-muted-foreground mb-3">Loading sessions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 p-2 min-h-0 overflow-y-auto">
        <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-center p-4">
          <p className="text-destructive mb-3">Failed to load sessions</p>
          <p className="text-muted-foreground text-sm">{error.message}</p>
        </div>
      </div>
    );
  }

  const handleSelect = (sessionId: string) => {
    const isInChat = location.pathname.startsWith("/");
    if (!isInChat) {
      void navigate({ to: "/" });
    }
    selectSession(sessionId);
  };

  const handleFork = (_sessionId: string) => {
    // mock: no-op
  };

  if (filteredSessions.length === 0) {
    return (
      <div className="flex-1 p-2 min-h-0 overflow-y-auto">
        <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-center p-4">
          {searchQuery ? (
            <p className="text-muted-foreground">No chats found</p>
          ) : (
            <p className="text-muted-foreground mb-3">No sessions yet</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-2 min-h-0 overflow-y-auto">
      <div className="space-y-1">
        {filteredSessions.map((session: Session) => (
          <SessionItem
            key={session.id}
            session={session}
            isActive={session.id === selectedSessionId}
            onClick={() => handleSelect(session.id)}
            onRename={() => {}}
            onDelete={() => {}}
            onFork={() => handleFork(session.id)}
          />
        ))}
      </div>
    </div>
  );
}
