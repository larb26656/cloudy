import { useSessionStore, type Session } from "@cloudy/core-chat";

interface SessionListProps {
  onSelect?: (session: Session) => void;
}

export function ChatSessionList({ onSelect }: SessionListProps) {
  const { sessions, selectedSessionId, isLoading, selectSession } = useSessionStore();

  if (isLoading) {
    return <div className="p-4 text-sm text-muted-foreground">Loading sessions...</div>;
  }

  if (sessions.length === 0) {
    return (
      <div className="p-4 text-sm text-muted-foreground">
        No sessions yet. Create one to get started.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1 p-2">
      {sessions.map((session) => (
        <button
          key={session.id}
          onClick={() => {
            selectSession(session.id);
            onSelect?.(session);
          }}
          className={`flex flex-col items-start gap-1 rounded-lg px-3 py-2 text-left transition-colors ${
            selectedSessionId === session.id
              ? "bg-primary/10 text-primary"
              : "hover:bg-muted text-foreground"
          }`}
        >
          <span className="text-sm font-medium truncate w-full">
            {session.title || "Untitled Session"}
          </span>
          <span className="text-xs text-muted-foreground">
            {session.time?.updated ? new Date(session.time.updated).toLocaleDateString() : ""}
          </span>
        </button>
      ))}
    </div>
  );
}
