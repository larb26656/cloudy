// App.tsx
import { useEffect } from "react";
import { SessionList } from "./components/session/SessionList";
import { ChatContainer } from "./components/chat/ChatContainer";
import { MobileSidebar } from "./components/layout/Sidebar";
import { Header } from "./components/layout/Header";
import {
  ResizablePanel,
  ResizablePanelGroup,
  ResizableHandle,
} from "@/components/ui/resizable";
import { useDeviceType } from "./hooks";
import { oc } from "./lib/opencode";
import type { Event } from "@opencode-ai/sdk/v2";
import { useBoundStore } from "./stores";

function App() {
  const {} = useBoundStore();
  const {
    sessions,
    currentSessionId,
    loadSessions,
    handleEvent,
    createSession,
    sidebarOpen,
    setSidebarOpen,
    isDarkMode,
    selectedDirectory,
    deviceType,
    setDeviceType,
  } = useBoundStore();

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
      stream?.return?.("");
    };
  }, [selectedDirectory]);

  useEffect(() => {
    setDeviceType(deviceType);
  }, [deviceType, setDeviceType]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const currentSession = sessions.find((s) => s.id === currentSessionId);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  const sessionDir = currentSession?.directory ?? undefined;
  const sessionTitle = currentSession?.title;
  const sessionStatuses = useBoundStore((state) => state.sessionStatuses);
  const sessionStatus = currentSessionId
    ? (sessionStatuses[currentSessionId] ?? null)
    : null;

  if (isMobile || isTablet) {
    return (
      <>
        <MobileSidebar open={sidebarOpen} onOpenChange={setSidebarOpen} />
        <div className="flex flex-col h-[100dvh] bg-white dark:bg-gray-900 overflow-hidden">
          <Header
            sessionTitle={sessionTitle}
            sessionDirectory={sessionDir}
            sessionStatus={sessionStatus}
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
                  onClick={() => createSession()}
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
                    onClick={() => createSession()}
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
