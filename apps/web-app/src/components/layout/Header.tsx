import type { ReactNode } from "react";
import {
  PanelLeftClose,
  PanelLeft,
  Sun,
  Moon,
  RefreshCw,
  MoreHorizontal,
  PanelRight,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useChatUIStore } from "@/stores";

interface HeaderProps {
  title?: string;
  subtitle?: string;
  centerSlot?: ReactNode;
  rightSlot?: ReactNode;
  showRefresh?: boolean;
  showThemeToggle?: boolean;
  showMinimapToggle?: boolean;
  isMinimapVisible?: boolean;
  onToggleMinimap?: () => void;
}

export function Header({
  title,
  subtitle,
  centerSlot,
  rightSlot,
  showRefresh = true,
  showThemeToggle = true,
  showMinimapToggle = false,
  isMinimapVisible = false,
  onToggleMinimap,
}: HeaderProps) {
  const { sidebarOpen, toggleSidebar, isDarkMode, toggleTheme } =
    useChatUIStore();

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <header className="p-2 bg-background flex items-center justify-between gap-3">
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
        <h1 className="font-semibold text-gray-800 dark:text-white truncate">
          {title || "Cloudy"}
        </h1>
        {subtitle && (
          <span className="text-xs text-gray-500 dark:text-gray-400 truncate hidden sm:block">
            {subtitle}
          </span>
        )}
      </div>

      {centerSlot && (
        <div className="flex-1 flex items-center justify-center min-w-0 max-w-xl">
          {centerSlot}
        </div>
      )}

      <div className="flex items-center gap-1 shrink-0">
        {rightSlot}

        {(showRefresh || showMinimapToggle || showThemeToggle) && (
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger>
                <DropdownMenuTrigger className="h-9 w-9 inline-flex items-center justify-center rounded-md hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground">
                  <MoreHorizontal className="size-5" />
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent>More options</TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="end">
              {showMinimapToggle && (
                <DropdownMenuItem onClick={onToggleMinimap}>
                  <PanelRight className="size-4 mr-2" />
                  <span>Toggle Chat Outline</span>
                  {isMinimapVisible && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      (On)
                    </span>
                  )}
                </DropdownMenuItem>
              )}
              {showThemeToggle && (
                <DropdownMenuItem onClick={toggleTheme}>
                  {isDarkMode ? (
                    <Sun className="size-4 mr-2" />
                  ) : (
                    <Moon className="size-4 mr-2" />
                  )}
                  <span>{isDarkMode ? "Light Mode" : "Dark Mode"}</span>
                </DropdownMenuItem>
              )}
              {showRefresh && (
                <DropdownMenuItem onClick={handleRefresh}>
                  <RefreshCw className="size-4 mr-2" />
                  <span>Refresh</span>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}
