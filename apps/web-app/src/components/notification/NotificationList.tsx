import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Info,
  X,
} from "lucide-react";
import type { ReactNode } from "react";
import { useNotifications, useDeleteNotification } from "@/hooks/queries";
import type {
  Notification,
  NotificationType,
} from "@/lib/cloudy/notifications";
import { formatRelativeFromTimestamp } from "@/lib/format";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import type { LucideIcon } from "lucide-react";

const TYPE_META: Record<
  NotificationType,
  { icon: LucideIcon; className: string }
> = {
  info: { icon: Info, className: "text-muted-foreground" },
  success: { icon: CheckCircle2, className: "text-foreground" },
  warning: { icon: AlertTriangle, className: "text-foreground" },
  error: { icon: AlertCircle, className: "text-destructive" },
};

export function NotificationList() {
  const {
    data: notifications,
    isLoading,
    isError,
    error,
    refetch,
  } = useNotifications();
  const deleteNotification = useDeleteNotification();

  let content: ReactNode;
  if (isLoading) {
    content = <LoadingState size="compact" title={null} />;
  } else if (isError) {
    content = (
      <ErrorState
        size="compact"
        bare
        message={
          error instanceof Error
            ? error.message
            : "Failed to load notifications"
        }
        onRetry={() => void refetch()}
      />
    );
  } else if (!notifications || notifications.length === 0) {
    content = (
      <EmptyState
        size="compact"
        title="No notifications"
        description="Session and agent activity will show up here"
      />
    );
  } else {
    content = (
      <ul className="flex flex-col">
        {notifications.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onDelete={() => deleteNotification.mutate(notification.id)}
            deletePending={deleteNotification.isPending}
          />
        ))}
      </ul>
    );
  }

  return content;
}

interface NotificationItemProps {
  notification: Notification;
  onDelete: () => void;
  deletePending: boolean;
}

function NotificationItem({
  notification,
  onDelete,
  deletePending,
}: NotificationItemProps) {
  const meta = TYPE_META[notification.type];
  const Icon = meta.icon;

  return (
    <li className="group flex items-start gap-2.5 px-3 py-2.5 hover:bg-muted/50">
      <Icon
        data-icon
        className={cn("mt-0.5 size-4 shrink-0", meta.className)}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="truncate text-sm font-medium">
            {notification.title}
          </span>
          <span className="shrink-0 text-xs whitespace-nowrap text-muted-foreground">
            {formatRelativeFromTimestamp(notification.createdAt.getTime())}
          </span>
        </div>
        {notification.message && (
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {notification.message}
          </p>
        )}
      </div>
      <button
        type="button"
        aria-label={`Delete notification: ${notification.title}`}
        onClick={onDelete}
        disabled={deletePending}
        className="mt-0.5 shrink-0 rounded-sm p-0.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive focus-visible:opacity-100 disabled:opacity-50"
      >
        <X data-icon className="size-3.5" />
      </button>
    </li>
  );
}
