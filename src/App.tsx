// App.tsx
import { useEffect, useCallback } from "react";
import { SessionList } from "./components/session/SessionList";
import { ChatContainer } from "./components/chat/ChatContainer";
import { MobileSidebar } from "./components/layout/Sidebar";
import { Header } from "./components/layout/Header";
import {
  ResizablePanel,
  ResizablePanelGroup,
  ResizableHandle,
} from "@/components/ui/resizable";
import { useSessionStore } from "./stores/sessionStore";
import { useUIStore } from "./stores/uiStore";
import { useEventSource, useDeviceType } from "./hooks";
import { oc } from "./lib/opencode";
import { useMessageStoreV2 } from "./stores/messageStoreV2";
import type { Event } from "@opencode-ai/sdk/v2";

function App() {
  const { sessions, currentSessionId, loadSessions } = useSessionStore();
  const { handleEvent } = useMessageStoreV2();
  const {
    sidebarOpen,
    isDarkMode,
    selectedDirectory,
    deviceType,
    setDeviceType,
    toggleSidebar,
    setSidebarOpen,
    toggleFullscreen,
  } = useUIStore();

  const { isMobile, isTablet } = useDeviceType();

  useEffect(() => {
    if (!selectedDirectory) return;

    let stream: AsyncGenerator<Event> | null = null;

    const subscribe = async () => {
      const events = await oc.event.subscribe({
        directory: selectedDirectory,
      });
      stream = events.stream;

      for await (const event of stream) {
        console.log(event);
        handleEvent(event);
      }
    };

    subscribe();

    return () => {
      // abortController.abort();
      stream?.return?.("");
    };
  }, [selectedDirectory]);
  // useEffect(() => {
  //   let isMounted = true;
  //   (async () => {
  //     const events = await oc.event.subscribe();
  //     console.log("invoke!2");
  //     console.log(events);
  //     // events.stream.return();

  //     for await (const event of events.stream) {
  //       if (!isMounted) {
  //         console.log("break!");
  //         break;
  //       }
  //       console.log(event);
  //       handleEvent(event);
  //     }
  //   })();

  //   return () => {
  //     isMounted = false;
  //     console.log("unsubscribe");
  //   };
  // }, []);

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

  const handleOpenSidebar = useCallback(() => {
    console.log("open");
    setSidebarOpen(true);
  }, [setSidebarOpen]);
  const handleCloseSidebar = useCallback(() => {
    console.log("close");
    setSidebarOpen(false);
  }, [setSidebarOpen]);

  // const handleOpencode = async () => {
  //   const session = await client.session.create();

  //   const data = session.data!;
  //   const result = await client.session.prompt({
  //     path: { id: data.id },
  //     body: {
  //       parts: [{ type: "text", text: "What is your name" }],
  //     },
  //   });

  //   const textData = result.data;

  //   console.log(textData);
  // };

  const sessionDir = currentSession?.directory ?? undefined;
  const sessionTitle = currentSession?.title;
  const sessionStatuses = useSessionStore((state) => state.sessionStatuses);
  const sessionStatus = currentSessionId
    ? (sessionStatuses[currentSessionId] ?? null)
    : null;

  if (isMobile || isTablet) {
    return (
      <>
        <MobileSidebar open={sidebarOpen} onClose={handleCloseSidebar} />
        <div className="flex flex-col h-screen bg-white dark:bg-gray-900 overflow-hidden">
          <Header
            sessionTitle={sessionTitle}
            sessionDirectory={sessionDir}
            sessionStatus={sessionStatus}
            onOpenSidebar={handleOpenSidebar}
            onCloseSidebar={handleCloseSidebar}
          />
          asdasd
          {JSON.stringify(sidebarOpen)}
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
      </>
    );
  }

  return (
    <div className="h-screen">
      <ResizablePanelGroup
        orientation="horizontal"
        className="bg-white dark:bg-gray-900"
      >
        {sidebarOpen && (
          <>
            <ResizablePanel defaultSize={25}>
              <SessionList />
            </ResizablePanel>
            <ResizableHandle
              withHandle
              className="bg-transparent border-none"
            />
          </>
        )}
        <ResizablePanel defaultSize={sidebarOpen ? 75 : 100}>
          <div className="flex flex-col h-full overflow-hidden">
            <Header
              sessionTitle={sessionTitle}
              sessionDirectory={sessionDir}
              sessionStatus={sessionStatus}
              onOpenSidebar={handleOpenSidebar}
              onCloseSidebar={handleCloseSidebar}
            />
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
