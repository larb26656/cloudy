import { useState } from "react";
import type { ReactElement } from "react";
import {
  ArrowLeftRight,
  EllipsisVertical,
  MessageSquarePlus,
  Repeat,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu";
import { Button } from "@repo/ui/components/button";
import { cn } from "@repo/ui/lib/utils";
import { SessionPickerDialog } from "@/components/session/SessionPickerDialog";
import { ProviderSwitchDialog } from "./ProviderSwitchDialog";

interface ChatSessionMenuProps {
  sessionId: string | null;
  directory: string;
  onSessionChange: (sessionId: string | null) => void;
  trigger?: ReactElement;
  /** When set together with onSwitchProvider, shows the provider switch item. */
  providerId?: string;
  onSwitchProvider?: (providerId: string) => void;
}

export function ChatSessionMenu({
  sessionId,
  directory,
  onSessionChange,
  trigger,
  providerId,
  onSwitchProvider,
}: ChatSessionMenuProps) {
  const [sessionPickerOpen, setSessionPickerOpen] = useState(false);
  const [providerSwitchOpen, setProviderSwitchOpen] = useState(false);
  const showProviderItem =
    providerId !== undefined && onSwitchProvider !== undefined;

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
        <DropdownMenuContent
          align="start"
          className={cn(showProviderItem ? "w-64" : "w-44")}
        >
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={() => onSessionChange(null)}>
              <MessageSquarePlus />
              New chat
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSessionPickerOpen(true)}>
              <ArrowLeftRight />
              Change session
            </DropdownMenuItem>
            {showProviderItem && (
              <DropdownMenuItem onClick={() => setProviderSwitchOpen(true)}>
                <Repeat />
                {sessionId
                  ? "Continue with another provider…"
                  : "Switch provider…"}
              </DropdownMenuItem>
            )}
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

      {showProviderItem && providerId !== undefined && (
        <ProviderSwitchDialog
          open={providerSwitchOpen}
          onOpenChange={setProviderSwitchOpen}
          currentProviderId={providerId}
          hasSession={sessionId != null}
          onConfirm={(targetProviderId) => onSwitchProvider?.(targetProviderId)}
        />
      )}
    </div>
  );
}
