import { SessionItem } from "./SessionItem";
import { Skeleton } from "@/components/ui/skeleton";
import { useSessionStore, useDirectoryStore } from "@/stores";
import { ErrorState } from "@/components/ui/error-state";
import { useNavigate, useRouterState } from "@tanstack/react-router";

interface SessionListProps {
  searchQuery: string;
}

export function SessionList({ searchQuery }: SessionListProps) {
  const navigate = useNavigate();
  const { location } = useRouterState();

  const {
    selectedSessionId,
    sessions,
    sessionStatuses,
    isLoading,
    error,
    loadSessions,
    updateSession,
    deleteSession,
    selectSession,
  } = useSessionStore();
  const { selectedDirectory } = useDirectoryStore();

  const filteredSessions = sessions.filter((session) =>
    (session.title || "New Chat")
      .toLowerCase()
      .includes(searchQuery.toLowerCase()),
  );

  const handleSelect = async (sessionId: string) => {
    const isInChat = location.pathname.startsWith("/chat");

    if (!isInChat) {
      await navigate({ to: "/" });
    }

    selectSession(sessionId);
  };

  const handleFork = async (sessionId: string) => {
    console.log("Fork session:", sessionId);
  };

  return (
    <div className="flex-1 p-2 min-h-0 overflow-y-auto">
      {error ? (
        <div className="flex items-center justify-center h-full min-h-[200px]">
          <ErrorState
            message={error}
            onRetry={() => loadSessions(selectedDirectory || "")}
          />
        </div>
      ) : isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3">
              <Skeleton className="size-9 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredSessions.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          {searchQuery ? "No chats found" : "No chats yet"}
        </div>
      ) : (
        <div className="space-y-1">
          {filteredSessions.map((session) => (
            <SessionItem
              key={session.id}
              session={session}
              isActive={session.id === selectedSessionId}
              status={sessionStatuses[session.id]}
              onClick={() => handleSelect(session.id)}
              onRename={(title) => updateSession(session.id, title)}
              onDelete={() => deleteSession(session.id)}
              onFork={() => handleFork(session.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
