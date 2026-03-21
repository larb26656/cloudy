// components/layout/Header.tsx
import { PanelLeftClose, PanelLeft, Sun, Moon, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { SessionStatus } from "@opencode-ai/sdk";
import { useChatUIStore, useMessageStore, useSessionStore } from "@/stores";

interface HeaderProps {
  sessionTitle?: string | null;
  sessionDirectory?: string | null;
  sessionStatus?: SessionStatus | null;
  onOpenSidebar?: () => void;
  onCloseSidebar?: () => void;
}

export function Header({ sessionTitle, sessionDirectory }: HeaderProps) {
  const { sidebarOpen, toggleSidebar, isDarkMode, toggleTheme } =
    useChatUIStore();

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <header className="p-2 bg-white dark:bg-gray-900 flex items-center justify-between">
      <div className="flex items-center gap-3 w-full">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="h-9 w-9"
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

        <h1 className="flex-1 font-semibold text-gray-800 dark:text-white truncate">
          {sessionTitle || "OpenCode Chat"}
        </h1>

        {sessionDirectory && (
          <span className="text-sm text-gray-500 dark:text-gray-400 truncate hidden sm:inline-block">
            {sessionDirectory}
          </span>
        )}

        <div className="flex items-center gap-1">
          {/* {sessionStatus && (
          <div className="flex items-center gap-2">
            {sessionStatus === "busy" && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 rounded-full text-sm">
                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                Processing...
              </div>
            )}
            {sessionStatus === "retry" && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-full text-sm">
                <div className="w-2 h-2 bg-red-500 rounded-full" />
                Error - Retrying
              </div>
            )}
            {(sessionStatus === "idle" || !sessionStatus) && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-full text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                Ready
              </div>
            )}
          </div>
        )} */}

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
        </div>
      </div>
    </header>
  );
}
