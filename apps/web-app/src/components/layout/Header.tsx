import type { ReactNode } from "react";
import { PanelLeftClose, PanelLeft, Sun, Moon, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  rightSlot?: ReactNode;
  showRefresh?: boolean;
  showThemeToggle?: boolean;
}

export function Header({
  title,
  subtitle,
  centerSlot,
  rightSlot,
  showRefresh = true,
  showThemeToggle = true,
}: HeaderProps) {
  const { sidebarOpen, toggleSidebar, isDarkMode, toggleTheme } =
    useChatUIStore();

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <header className="p-2 bg-white dark:bg-gray-900 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="h-9 w-9 shrink-0"
            >
              {sidebarOpen ? (
                <PanelLeftClose className="size-5" />
              ) : (
                <PanelLeft className="size-5" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {sidebarOpen ? "Close sidebar" : "Open sidebar"} (Cmd+B)
          </TooltipContent>
        </Tooltip>

        <div className="flex flex-col min-w-0">
          <h1 className="font-semibold text-gray-800 dark:text-white truncate">
            {title || "Cloudy"}
          </h1>
          {subtitle && (
            <span className="text-xs text-gray-500 dark:text-gray-400 truncate hidden sm:block">
              {subtitle}
            </span>
          )}
        </div>
      </div>

      {centerSlot && (
        <div className="flex-1 flex items-center justify-center min-w-0 max-w-xl">
          {centerSlot}
        </div>
      )}

      <div className="flex items-center gap-1 shrink-0">
        {rightSlot}

        {showRefresh && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleRefresh}
                className="h-9 w-9"
              >
                <RefreshCw className="size-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Refresh</TooltipContent>
          </Tooltip>
        )}

        {showThemeToggle && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="h-9 w-9"
              >
                {isDarkMode ? (
                  <Sun className="size-5" />
                ) : (
                  <Moon className="size-5" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {isDarkMode ? "Light mode" : "Dark mode"}
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </header>
  );
}
