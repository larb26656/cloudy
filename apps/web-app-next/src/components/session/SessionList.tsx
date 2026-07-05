import { SessionItem } from "./SessionItem";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import type { Session } from "@opencode-ai/sdk/v2";

type SessionListProps = {
  searchQuery: string;
  sessions: Session[];
};

export function SessionList({ searchQuery, sessions }: SessionListProps) {
  const navigate = useNavigate();
  const { location } = useRouterState();
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
    sessions[0]?.id ?? null,
  );

  const filteredSessions = sessions
    .filter((session) => !session.parentID)
    .filter((session) =>
      (session.title || "New Chat")
        .toLowerCase()
        .includes(searchQuery.toLowerCase()),
    );

  const handleSelect = (sessionId: string) => {
    const isInChat = location.pathname.startsWith("/");
    if (!isInChat) {
      void navigate({ to: "/" });
    }
    setSelectedSessionId(sessionId);
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
        {filteredSessions.map((session) => (
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
