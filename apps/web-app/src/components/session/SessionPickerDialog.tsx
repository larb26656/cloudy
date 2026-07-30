import type { Session } from "@opencode-ai/sdk/v2";

import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useSessions } from "@/hooks/queries/useSessions";
import { formatRelativeFromTimestamp } from "@/lib/format";
import { Check } from "lucide-react";

interface SessionPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  directory: string;
  sessionId: string | null;
  onSessionChange: (id: string) => void;
}

export function SessionPickerDialog({
  open,
  onOpenChange,
  directory,
  sessionId,
  onSessionChange,
}: SessionPickerDialogProps) {
  const { data: sessions = [] } = useSessions({ directory });

  const rootSessions = sessions.filter((s: Session) => !s.parentID);

  const handleSelect = (id: string) => {
    onSessionChange(id);
    onOpenChange(false);
  };

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
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Navigation">
            {rootSessions.map((session) => {
              const isCurrent = session.id === sessionId;
              return (
                <CommandItem
                  key={session.id}
                  value={`${session.title} ${session.id}`}
                  disabled={isCurrent}
                  onSelect={() => handleSelect(session.id)}
                >
                  <div className="flex w-full flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">
                        {session.title || "New Chat"}
                      </span>
                      {isCurrent && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                          current
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatRelativeFromTimestamp(session.time.updated)}
                    </span>
                  </div>
                  {isCurrent && (
                    <Check className="ml-auto size-4 opacity-100" />
                  )}
                </CommandItem>
              );
            })}
            <CommandItem>
              <span>Home</span>
            </CommandItem>
            <CommandItem>
              <span>Inbox</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
