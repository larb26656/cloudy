// components/layout/Header.tsx
import { Menu, Settings, Maximize2, Minimize2, PanelLeftClose, PanelLeft, Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useUIStore } from '@/stores/uiStore';

interface HeaderProps {
  sessionTitle?: string | null;
  sessionDirectory?: string | null;
  onOpenSidebar?: () => void;
  onCloseSidebar?: () => void;
}

export function Header({ 
  sessionTitle, 
  sessionDirectory,
  onOpenSidebar, 
  onCloseSidebar 
}: HeaderProps) {
  const { 
    deviceType, 
    sidebarOpen, 
    isFullscreen, 
    toggleSidebar, 
    toggleFullscreen,
    isDarkMode,
    toggleTheme 
  } = useUIStore();

  const isMobile = deviceType === 'mobile';
  const isTablet = deviceType === 'tablet';

  const handleToggleSidebar = () => {
    if (isMobile || isTablet) {
      if (sidebarOpen && onCloseSidebar) {
        onCloseSidebar();
      } else if (!sidebarOpen && onOpenSidebar) {
        onOpenSidebar();
      }
    } else {
      toggleSidebar();
    }
  };

  return (
    <header className="border-b border-gray-200 dark:border-gray-800 px-4 py-3 bg-white dark:bg-gray-900 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {(isMobile || isTablet) && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleToggleSidebar}
                className="h-9 w-9"
              >
                {sidebarOpen ? (
                  <PanelLeftClose className="size-5" />
                ) : (
                  <Menu className="size-5" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
            </TooltipContent>
          </Tooltip>
        )}
        
        <div className="flex items-center gap-2">
          {(!isMobile && !isTablet) && !sidebarOpen && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleSidebar}
                  className="h-9 w-9"
                >
                  <PanelLeft className="size-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                Open sidebar (Cmd+B)
              </TooltipContent>
            </Tooltip>
          )}
          
          <h1 className="text-lg font-semibold text-gray-800 dark:text-white">
            {sessionTitle || 'OpenCode Chat'}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-1">
        {sessionDirectory && !isMobile && (
          <span className="text-sm text-gray-500 dark:text-gray-400 mr-2 hidden sm:inline-block">
            {sessionDirectory}
          </span>
        )}

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleFullscreen}
              className="h-9 w-9"
            >
              {isFullscreen ? (
                <Minimize2 className="size-5" />
              ) : (
                <Maximize2 className="size-5" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {isFullscreen ? 'Exit fullscreen' : 'Fullscreen'} (Cmd+Shift+F)
          </TooltipContent>
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
            {isDarkMode ? 'Light mode' : 'Dark mode'}
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Settings className="size-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            Settings
          </TooltipContent>
        </Tooltip>
      </div>
    </header>
  );
}
