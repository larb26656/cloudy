import { MessageCircle } from "lucide-react";
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@repo/ui/components/command";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { ProviderIcon } from "@/components/provider/ProviderIcon";
import { useQuickCloudySuggestions } from "@/hooks/queries/useQuickCloudy";
import type { RecentChatSession } from "@/types";

type QuickCloudySearchResultsProps = {
  initialPrompt: string;
  onPromptChange: (prompt: string) => void;
  onSelectSession: (session: RecentChatSession) => void;
  onSubmitPrompt: (providerId: string, agent: string) => void;
  disabled: boolean;
};

export function QuickCloudySearchResults({
  initialPrompt,
  onPromptChange,
  onSelectSession,
  onSubmitPrompt,
  disabled,
}: QuickCloudySearchResultsProps) {
  const trimmedPrompt = initialPrompt.trim();
  const searchPrompt = useDebouncedValue(trimmedPrompt);

  const { data } = useQuickCloudySuggestions({
    search: searchPrompt || undefined,
  });
  const agents = data?.agents ?? [];
  const sessions = data?.recentSessions ?? [];

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
          <CommandGroup heading="Ask">
            <CommandItem
              value={`cloudy ${trimmedPrompt}`}
              onSelect={() => onSubmitPrompt("cloudy", "ask")}
              className="quick-cloudy-item-enter min-w-0"
            >
              <MessageCircle />
              <span className="min-w-0 flex-1 truncate">
                Ask Cloudy “{trimmedPrompt}”
              </span>
              <CommandShortcut>↵</CommandShortcut>
            </CommandItem>
            {agents
              .filter((agent) => !agent.builtIn)
              .map((agent) => (
                <CommandItem
                  key={agent.id}
                  value={`${agent.name} ${trimmedPrompt}`}
                  onSelect={() => onSubmitPrompt("cloudy", agent.id)}
                  className="quick-cloudy-item-enter min-w-0"
                >
                  <MessageCircle />
                  <span className="min-w-0 flex-1 truncate">
                    Ask {agent.name} “{trimmedPrompt}”
                  </span>
                  <CommandShortcut>↵</CommandShortcut>
                </CommandItem>
              ))}
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
