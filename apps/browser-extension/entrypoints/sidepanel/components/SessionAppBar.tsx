import { useState } from "react";
import type { Session } from "@opencode-ai/sdk/v2/client";
import { ChevronDown, MessageSquarePlus } from "lucide-react";
import { AppBar } from "@repo/ui/components/app-bar";
import { Button } from "@repo/ui/components/button";
import { SessionPicker } from "./SessionPicker";

interface SessionAppBarProps {
  sessions: Session[];
  sessionId: string | null;
  isLoading: boolean;
  error: Error | null;
  onSessionChange: (sessionId: string) => void;
  onNewChat: () => void;
}

export function SessionAppBar({
  sessions,
  sessionId,
  isLoading,
  error,
  onSessionChange,
  onNewChat,
}: SessionAppBarProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const rootSessions = sessions.filter((session) => !session.parentID);
  const activeSession = rootSessions.find(
    (session) => session.id === sessionId,
  );
  const title = activeSession?.title || "New Chat";

  return (
    <>
      <AppBar>
        <AppBar.Title>
          <Button
            variant="ghost"
            className="h-9 min-w-0 justify-start gap-1.5 px-2 -ml-2"
            onClick={() => setPickerOpen(true)}
            aria-label="Switch session"
          >
            <span className="truncate">{title}</span>
            <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
          </Button>
        </AppBar.Title>
        <AppBar.Actions>
          <AppBar.ActionIcon
            icon={MessageSquarePlus}
            label="New chat"
            onClick={onNewChat}
          />
        </AppBar.Actions>
      </AppBar>

      <SessionPicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        sessions={sessions}
        sessionId={sessionId}
        isLoading={isLoading}
        error={error}
        onSessionChange={onSessionChange}
      />
    </>
  );
}
