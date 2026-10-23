import { MessageCircle } from "lucide-react";
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@repo/ui/components/command";
import { useRecentSessions } from "@/hooks/queries/useSessions";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { ProviderIcon } from "@/components/provider/ProviderIcon";
import type { RecentChatSession } from "@/types";

type QuickCloudySessionPickerProps = {
  initialPrompt: string;
  onPromptChange: (prompt: string) => void;
  recentSessions: RecentChatSession[];
  onSelectSession: (session: RecentChatSession) => void;
  onSubmitPrompt: () => void;
  disabled: boolean;
};

export function QuickCloudySessionPicker({
  initialPrompt,
  onPromptChange,
  recentSessions,
  onSelectSession,
  onSubmitPrompt,
  disabled,
}: QuickCloudySessionPickerProps) {
  const trimmedPrompt = initialPrompt.trim();
  const searchPrompt = useDebouncedValue(trimmedPrompt);

  const { data: matchingSessions = [] } = useRecentSessions({
    limit: 100,
    search: searchPrompt || undefined,
  });
  const sessions = searchPrompt ? matchingSessions : recentSessions;

  return (
    <Command
      shouldFilter={false}
      className="h-auto flex-1 rounded-2xl border-0 bg-transparent p-2 shadow-none"
    >
      <CommandInput
        value={initialPrompt}
        onValueChange={onPromptChange}
        placeholder="Ask Cloudy…"
        aria-label="Ask Cloudy"
        disabled={disabled}
      />
      <CommandList>
        {trimmedPrompt && (
          <CommandGroup>
            <CommandItem
              value={trimmedPrompt}
              onSelect={onSubmitPrompt}
              className="quick-cloudy-item-enter min-w-0"
            >
              <MessageCircle />
              <span className="min-w-0 flex-1 truncate">
                Ask Cloudy “{trimmedPrompt}”
              </span>
              <CommandShortcut>↵</CommandShortcut>
            </CommandItem>
          </CommandGroup>
        )}
        {sessions.length > 0 && (
          <CommandGroup heading="Recent chats">
            {sessions.slice(0, 5).map((session) => (
              <CommandItem
                key={session.id}
                value={session.id}
                onSelect={() => onSelectSession(session)}
                className="quick-cloudy-item-enter min-w-0"
              >
                <ProviderIcon providerId={session.providerId} />
                <span className="min-w-0 flex-1 truncate">
                  {session.title || session.directory || "Untitled chat"}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </Command>
  );
}
