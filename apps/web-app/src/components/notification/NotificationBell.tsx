import { useState } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { useClearNotifications, useNotifications } from "@/hooks/queries";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { NotificationList } from "./NotificationList";

interface NotificationBellProps {
  className?: string;
}

export function NotificationBell({ className }: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const { data: notifications } = useNotifications();
  const clearNotifications = useClearNotifications();

  const count = notifications?.length ?? 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <button
            type="button"
            aria-label="Notifications"
            className={cn(
              "flex items-center gap-1 px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
              className,
            )}
          />
        }
      >
        <Bell data-icon className="size-4" />
        {count > 0 && (
          <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold tabular-nums text-primary-foreground">
            {count}
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 gap-0 p-0">
        <div className="flex items-center justify-between border-b px-3 py-2">
          <span className="text-sm font-semibold">Notifications</span>
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
        <div className="max-h-96 overflow-y-auto">
          <NotificationList />
        </div>
      </PopoverContent>
    </Popover>
  );
}
