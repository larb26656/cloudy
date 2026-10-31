import { useState } from "react";
import { CheckCheck } from "lucide-react";
import { useClearNotifications, useNotifications } from "@/hooks/queries";
import { useAgentActivity } from "@/hooks/useAgentActivity";
import { useTabStore } from "@/stores/tabStore";
import type { RecentChatSession } from "@/types";
import { AgentActivityList } from "./AgentActivityList";
import { cn } from "@repo/ui/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTitle,
  PopoverTrigger,
} from "@repo/ui/components/popover";
import { Button } from "@repo/ui/components/button";
import { NotificationDot } from "@repo/ui/components/notification-dot";
import { Separator } from "@repo/ui/components/separator";
import { PetSprite } from "@/features/pet/PetSprite";
import type { PetState } from "@/features/pet/PetSprite";
import { openSessionTab } from "@/features/pet/openSessionTab";
import { NotificationList } from "./NotificationList";

interface NotificationBellProps {
  className?: string;
}

export function NotificationBell({ className }: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const { data: notifications } = useNotifications();
  const clearNotifications = useClearNotifications();
  const {
    records,
    activityState,
    waitingCount,
    workingCount,
    isLoading,
    error,
    workspaces,
  } = useAgentActivity();
  const openTab = useTabStore((state) => state.openTab);

  const count = notifications?.length ?? 0;
  const hasUnread = count > 0;
  const petState: PetState = activityState;
  const activityLabel =
    waitingCount > 0
      ? `${waitingCount} session${waitingCount === 1 ? "" : "s"} waiting for you`
      : workingCount > 0
        ? `${workingCount} session${workingCount === 1 ? "" : "s"} working`
        : "No active sessions";
  const triggerLabel = `Cloudy: ${activityLabel}${
    hasUnread ? `, ${count} unread notifications` : ""
  }`;

  const handleOpenSession = (session: RecentChatSession) => {
    const payload = openSessionTab(session, workspaces);
    openTab(payload.type, payload.data);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <button
            type="button"
            aria-label={triggerLabel}
            className={cn(
              "flex items-center gap-1 px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
              className,
            )}
          />
        }
      >
        <span className="relative inline-flex">
          <span className="block size-6">
            <PetSprite state={petState} />
          </span>
          <NotificationDot visible={hasUnread} />
        </span>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 gap-0 overflow-hidden p-0">
        <div className="max-h-[min(32rem,calc(100dvh-2rem))] overflow-y-auto">
          <section aria-labelledby="agent-activity-heading">
            <div className="border-b px-3 py-2">
              <PopoverTitle
                id="agent-activity-heading"
                className="text-sm font-semibold"
              >
                Agent activity
              </PopoverTitle>
            </div>
            <AgentActivityList
              isLoading={isLoading}
              error={error}
              records={records}
              workspaces={workspaces}
              onOpenSession={handleOpenSession}
            />
          </section>
          <Separator />
          <section aria-labelledby="notifications-heading">
            <div className="flex items-center justify-between border-b px-3 py-2">
              <h2 id="notifications-heading" className="text-sm font-semibold">
                Notifications
              </h2>
              {count > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs text-muted-foreground"
                  disabled={clearNotifications.isPending}
                  onClick={() => clearNotifications.mutate()}
                >
                  <CheckCheck data-icon="inline-start" className="size-3.5" />
                  Clear all
                </Button>
              )}
            </div>
            <NotificationList />
          </section>
        </div>
      </PopoverContent>
    </Popover>
  );
}
