import {
  ArrowLeftRight,
  EllipsisVertical,
  MessageSquarePlus,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu";
import { Button } from "@repo/ui/components/button";
import { SessionPickerDialog } from "@/components/session/SessionPickerDialog";
import { useSession } from "@/hooks/queries/useSessions";
import { useChat } from "./ChatProvider";

/**
 * Session dropdown for the bot chat surface. A vertical-ellipsis button
 * that opens a menu showing the current session title with "New chat"
 * (lazily creates a session on the next message) and "Change session"
 * (opens the searchable SessionPickerDialog). Shared by the bot-chat tab
 * and the desk bot-chat node via BotChatContainer.
 */
export function BotChatSessionMenu() {
  const {
    sessionId,
    directory,
    changeSession,
    sessionPickerOpen,
    setSessionPickerOpen,
  } = useChat();
  const { data: session } = useSession({ sessionId, directory });

  return (
    <div className="flex min-w-0 flex-1 items-center">
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="ghost" size="icon-sm" aria-label="Session menu">
              <EllipsisVertical className="size-4" />
            </Button>
          }
        />
        <DropdownMenuContent align="start" className="w-44">
          <DropdownMenuGroup>
            <DropdownMenuLabel className="max-w-full truncate">
              {session?.title ?? "New Bot Chat"}
            </DropdownMenuLabel>
            <DropdownMenuItem onClick={() => changeSession(null)}>
              <MessageSquarePlus />
              New chat
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSessionPickerOpen(true)}>
              <ArrowLeftRight />
              Change session
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <SessionPickerDialog
        open={sessionPickerOpen}
        onOpenChange={setSessionPickerOpen}
        directory={directory}
        sessionId={sessionId}
        onSessionChange={changeSession}
      />
    </div>
  );
}
