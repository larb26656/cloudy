import type { ReactNode } from "react";
import {
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useChatUIStore } from "@/stores";

interface HeaderProps {
  title?: string;
  subtitle?: string;
  centerSlot?: ReactNode;
  actions?: ReactNode[];
}

export function Header({
  title,
  subtitle,
  centerSlot,
  actions,
}: HeaderProps) {
  const { sidebarOpen, toggleSidebar } = useChatUIStore();

  return (
    <header className="p-2 bg-background flex items-center justify-between gap-3 relative">
      <div>
        <Tooltip>
          <TooltipTrigger
            onClick={toggleSidebar}
            className="h-9 w-9 shrink-0 inline-flex items-center justify-center rounded-md hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground"
          >
            {sidebarOpen ? (
              <PanelLeftClose className="size-5" />
            ) : (
              <PanelLeft className="size-5" />
            )}
          </TooltipTrigger>
          <TooltipContent>
            {sidebarOpen ? "Close sidebar" : "Open sidebar"} (Cmd+B)
          </TooltipContent>
        </Tooltip>
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        {!centerSlot && (
          <>
            <h1 className="font-semibold text-gray-800 dark:text-white truncate">
              {title || "Cloudy"}
            </h1>
            {subtitle && (
              <span className="text-xs text-gray-500 dark:text-gray-400 truncate hidden sm:block">
                {subtitle}
              </span>
            )}
          </>
        )}
      </div>

      {centerSlot && (
        <div className="absolute left-1/2 -translate-x-1/2">
          {centerSlot}
        </div>
      )}

      <div className="flex items-center gap-1 shrink-0 overflow-visible">{actions}</div>
    </header>
  );
}
