// App.tsx
import { useEffect, useState } from "react";
import { SessionList } from "./components/session/SessionList";
import { ChatContainer } from "./components/chat/ChatContainer";
import { MobileSidebar } from "./components/layout/Sidebar";
import { Header } from "./components/layout/Header";
import { WelcomeState } from "./components/chat/ChatEmptyState";
import { QuestionBanner } from "./components/question/QuestionBanner";
import { QuestionDialog } from "./components/question/QuestionDialog";
import { PermissionBanner } from "./components/permission/PermissionBanner";
import { PermissionDialog } from "./components/permission/PermissionDialog";
import {
  ResizablePanel,
  ResizablePanelGroup,
  ResizableHandle,
} from "@/components/ui/resizable";
import { useDeviceType } from "./hooks";
import {
  useSessionStore,
  useDirectoryStore,
  useMessageStore,
  useQuestionStore,
  usePermissionStore,
} from "./stores";
import { useChatWorkspace } from "@/hooks/useChatWorkspace";
import { useEventStream } from "@/hooks/useEventSteam";
import { useChatUIStore } from "@/stores/chatUIStore";

function App() {
  const { sessions, sessionStatuses, selectedSessionId, loadSessions } =
    useSessionStore();
  const { selectedDirectory } = useDirectoryStore();
  const { loadMessages } = useMessageStore();
  const { loadQuestions } = useQuestionStore();
  const { loadPermissions } = usePermissionStore();
  const { createSession } = useChatWorkspace();
  const { sidebarOpen, setSidebarOpen, isDarkMode, deviceType, setDeviceType } =
    useChatUIStore();

  const [questionDialogOpen, setQuestionDialogOpen] = useState(false);
  const [permissionDialogOpen, setPermissionDialogOpen] = useState(false);

  useEventStream();

  const { isMobile, isTablet } = useDeviceType();

  useEffect(() => {
    if (selectedDirectory) {
      loadSessions(selectedDirectory);
      loadQuestions(selectedDirectory);
      loadPermissions(selectedDirectory);
    }
  }, [selectedDirectory, loadSessions, loadQuestions, loadPermissions]);

  useEffect(() => {
    if (selectedSessionId) {
      loadMessages(selectedSessionId);
    }
  }, [selectedSessionId, loadMessages]);

  useEffect(() => {
    setDeviceType(deviceType);
  }, [deviceType, setDeviceType]);

  const currentSession = sessions.find((s) => s.id === selectedSessionId);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  const sessionDir = currentSession?.directory ?? undefined;
  const sessionTitle = currentSession?.title;
  const sessionStatus = selectedSessionId
    ? (sessionStatuses[selectedSessionId] ?? null)
    : null;

  if (isMobile || isTablet) {
    return (
      <>
        <MobileSidebar open={sidebarOpen} onOpenChange={setSidebarOpen} />
        <div className="flex flex-col h-[100dvh] bg-white dark:bg-gray-900 overflow-hidden">
          <PermissionBanner
            onOpenDialog={() => setPermissionDialogOpen(true)}
          />
          <QuestionBanner onOpenDialog={() => setQuestionDialogOpen(true)} />
          <Header
            sessionTitle={sessionTitle}
            sessionDirectory={sessionDir}
            sessionStatus={sessionStatus}
          />
          {selectedSessionId ? (
            <>
              <ChatContainer />
            </>
          ) : (
            <WelcomeState
              onCreateSession={createSession}
              selectedDirectory={selectedDirectory}
            />
          )}
        </div>
        <QuestionDialog
          open={questionDialogOpen}
          onOpenChange={setQuestionDialogOpen}
        />
        <PermissionDialog
          open={permissionDialogOpen}
          onOpenChange={setPermissionDialogOpen}
        />
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
            <ResizablePanel defaultSize={25} className="p-2">
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
            <PermissionBanner
              onOpenDialog={() => setPermissionDialogOpen(true)}
            />
            <QuestionBanner onOpenDialog={() => setQuestionDialogOpen(true)} />
            <Header
              sessionTitle={sessionTitle}
              sessionDirectory={sessionDir}
              sessionStatus={sessionStatus}
            />
            {selectedSessionId ? (
              <>
                <ChatContainer />
              </>
            ) : (
              <WelcomeState
                onCreateSession={createSession}
                selectedDirectory={selectedDirectory}
              />
            )}
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
      <QuestionDialog
        open={questionDialogOpen}
        onOpenChange={setQuestionDialogOpen}
      />
      <PermissionDialog
        open={permissionDialogOpen}
        onOpenChange={setPermissionDialogOpen}
      />
    </div>
  );
}

export default App;
