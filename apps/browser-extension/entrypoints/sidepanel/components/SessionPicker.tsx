import type { Session } from "@opencode-ai/sdk/v2/client";
import { Check } from "lucide-react";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@repo/ui/components/command";
import { ErrorState } from "@repo/ui/components/error-state";
import { LoadingState } from "@repo/ui/components/loading-state";

interface SessionPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessions: Session[];
  sessionId: string | null;
  isLoading: boolean;
  error: Error | null;
  onSessionChange: (sessionId: string) => void;
}

export function SessionPicker({
  open,
  onOpenChange,
  sessions,
  sessionId,
  isLoading,
  error,
  onSessionChange,
}: SessionPickerProps) {
  const rootSessions = sessions.filter((session) => !session.parentID);

  function selectSession(id: string) {
    onSessionChange(id);
    onOpenChange(false);
  }

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Switch session"
      description="Search and select a session to switch to"
    >
      <Command>
        <CommandInput placeholder="Search sessions..." />
        <CommandList>
          {isLoading ? (
            <LoadingState size="compact" title={null} />
          ) : error ? (
            <ErrorState size="compact" bare message={error.message} />
          ) : (
            <>
              <CommandEmpty>No sessions found.</CommandEmpty>
              <CommandGroup heading="Sessions">
                {rootSessions.map((session) => {
                  const isCurrent = session.id === sessionId;
                  return (
                    <CommandItem
                      key={session.id}
                      value={`${session.title} ${session.id}`}
                      disabled={isCurrent}
                      onSelect={() => selectSession(session.id)}
                    >
                      <span className="truncate">
                        {session.title || "New Chat"}
                      </span>
                      {isCurrent && <Check className="ml-auto size-4" />}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </>
          )}
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
