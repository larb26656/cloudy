import { useState } from "react";
import type { ReactElement } from "react";
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
  DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu";
import { Button } from "@repo/ui/components/button";
import { SessionPickerDialog } from "@/components/session/SessionPickerDialog";

interface ChatSessionMenuProps {
  sessionId: string | null;
  directory: string;
  onSessionChange: (sessionId: string | null) => void;
  trigger?: ReactElement;
}

export function ChatSessionMenu({
  sessionId,
  directory,
  onSessionChange,
  trigger,
}: ChatSessionMenuProps) {
  const [sessionPickerOpen, setSessionPickerOpen] = useState(false);

  return (
    <div className="flex min-w-0 items-center">
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            trigger ?? (
              <Button variant="ghost" size="icon-sm" aria-label="Session menu">
                <EllipsisVertical className="size-4" />
              </Button>
            )
          }
        />
        <DropdownMenuContent align="start" className="w-44">
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={() => onSessionChange(null)}>
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
        onSessionChange={onSessionChange}
      />
    </div>
  );
}
