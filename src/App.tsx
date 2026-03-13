// App.tsx
import { useEffect, useCallback } from "react";
import { SessionList } from "./components/session/SessionList";
import { ChatContainer } from "./components/chat/ChatContainer";
import { Header } from "./components/layout/Header";
import { MobileSidebar } from "./components/layout/Sidebar";
import {
  ResizablePanel,
  ResizablePanelGroup,
  ResizableHandle,
} from "@/components/ui/resizable";
import { useSessionStore } from "./stores/sessionStore";
import { useUIStore } from "./stores/uiStore";
import { useEventSource, useDeviceType } from "./hooks";
import { X } from "lucide-react";
import { ScrollArea } from "./components/ui/scroll-area";

function App() {
  const { sessions, currentSessionId, loadSessions } = useSessionStore();
  const {
    sidebarOpen,
    isDarkMode,
    selectedDirectory,
    deviceType,
    isFullscreen,
    setDeviceType,
    toggleSidebar,
    setSidebarOpen,
    toggleFullscreen,
  } = useUIStore();

  const { isMobile, isTablet } = useDeviceType();

  useEffect(() => {
    setDeviceType(deviceType);
  }, [deviceType, setDeviceType]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const currentSession = sessions.find((s) => s.id === currentSessionId);
  const directory = selectedDirectory || currentSession?.directory || null;

  useEventSource(directory);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const modifier = isMac ? e.metaKey : e.ctrlKey;

      if (modifier && e.key === "b") {
        e.preventDefault();
        toggleSidebar();
      }

      if (modifier && e.shiftKey && e.key === "F") {
        e.preventDefault();
        toggleFullscreen();
      }

      if (e.key === "Escape" && (isMobile || isTablet) && sidebarOpen) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    toggleSidebar,
    toggleFullscreen,
    isMobile,
    isTablet,
    sidebarOpen,
    setSidebarOpen,
  ]);

  useEffect(() => {
    if (!isMobile && !isTablet) {
      // On desktop
    } else {
      if (currentSessionId && sidebarOpen) {
        setSidebarOpen(false);
      }
    }
  }, [currentSessionId, isMobile, isTablet, sidebarOpen, setSidebarOpen]);

  const handleOpenSidebar = useCallback(
    () => setSidebarOpen(true),
    [setSidebarOpen],
  );
  const handleCloseSidebar = useCallback(
    () => setSidebarOpen(false),
    [setSidebarOpen],
  );

  const sessionDir = currentSession?.directory ?? undefined;
  const sessionTitle = currentSession?.title;

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-white dark:bg-gray-900">
        <div className="flex flex-col h-full">
          <button
            onClick={toggleFullscreen}
            className="fixed top-4 right-4 z-50 p-2 bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            aria-label="Exit fullscreen"
          >
            <X className="size-5" />
          </button>

          {currentSessionId ? (
            <ChatContainer sessionId={currentSessionId} />
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-3xl flex items-center justify-center shadow-lg">
                  <span className="text-white text-3xl font-bold">AI</span>
                </div>
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
                  OpenCode Chat
                </h1>
                <button
                  onClick={() => useSessionStore.getState().createSession()}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors"
                >
                  Start New Chat
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (isMobile || isTablet) {
    return (
      <div className="flex h-screen bg-white dark:bg-gray-900 overflow-hidden">
        <MobileSidebar open={sidebarOpen} onClose={handleCloseSidebar} />

        <div className="flex-1 flex flex-col min-w-0">
          {currentSessionId ? (
            <>
              <Header
                sessionTitle={sessionTitle}
                sessionDirectory={sessionDir ?? undefined}
                onOpenSidebar={handleOpenSidebar}
                onCloseSidebar={handleCloseSidebar}
              />
              <ChatContainer sessionId={currentSessionId} />
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-3xl flex items-center justify-center shadow-lg">
                  <span className="text-white text-3xl font-bold">AI</span>
                </div>
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
                  OpenCode Chat
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mb-6">
                  Your AI-powered coding assistant
                </p>
                <button
                  onClick={() => useSessionStore.getState().createSession()}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors"
                >
                  Start New Chat
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  const sidebarSizePercent = sidebarOpen ? 25 : 0;

  return (
    <div className="h-screen">
      <ResizablePanelGroup
        orientation="horizontal"
        className="bg-white dark:bg-gray-900"
      >
        <ResizablePanel defaultSize="25%">
          <SessionList />
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize="75%">
          <div className="flex flex-col h-full">
            {currentSessionId ? (
              <>
                <ChatContainer sessionId={currentSessionId} />
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-3xl flex items-center justify-center shadow-lg">
                    <span className="text-white text-3xl font-bold">AI</span>
                  </div>
                  <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
                    OpenCode Chat
                  </h1>
                  <p className="text-gray-500 dark:text-gray-400 mb-6">
                    Your AI-powered coding assistant
                  </p>
                  <button
                    onClick={() => useSessionStore.getState().createSession()}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors"
                  >
                    Start New Chat
                  </button>
                </div>
              </div>
            )}
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}

export default App;
