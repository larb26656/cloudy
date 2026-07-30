import { cn } from "@/lib/utils";
import type { ServerStatus } from "@/providers";
import { Loader2Icon, WifiIcon, WifiOffIcon } from "lucide-react";

interface StatusBarProps {
  status: ServerStatus;
}

const statusConfig = {
  PENDING: {
    label: "Connecting",
    icon: Loader2Icon,
    variant: "info" as const,
    className: "animate-spin",
  },
  CONNETED: {
    label: "Connected",
    icon: WifiIcon,
    variant: "default" as const,
    className: "text-emerald-600 dark:text-emerald-400",
  },
  DISCONNECTED: {
    label: "Disconnected",
    icon: WifiOffIcon,
    variant: "destructive" as const,
    className: "",
  },
};

function StatusBar({ status }: StatusBarProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div className="flex gap-2 bg-muted py-1 px-2">
      <div className="flex-1" />
      <div className={cn("inline-flex items-center gap-1.5 text-xs")}>
        <span>Server: </span>
        <Icon className={cn("size-3.5", config.className)} />
        <span
          className={cn(
            status === "CONNETED" && "text-emerald-700 dark:text-emerald-300",
            status === "DISCONNECTED" && "text-red-700 dark:text-red-300",
            status === "PENDING" && "text-blue-700 dark:text-blue-300",
          )}
        >
          {config.label}
        </span>
      </div>
    </div>
  );
}

export { StatusBar };
export type { ServerStatus };
