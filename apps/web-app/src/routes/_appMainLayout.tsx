import { createFileRoute, Outlet } from "@tanstack/react-router";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileSidebar } from "@/components/layout/Sidebar";
import { QuestionBanner } from "@/components/question/QuestionBanner";
import { QuestionDialog } from "@/components/question/QuestionDialog";
import { PermissionBanner } from "@/components/permission/PermissionBanner";
import { PermissionDialog } from "@/components/permission/PermissionDialog";
import {
  ResizablePanel,
  ResizablePanelGroup,
  ResizableHandle,
} from "@/components/ui/resizable";
import { useDeviceType } from "@/hooks";
import { useEffect, useState } from "react";
import {
  useChatUIStore,
  useDirectoryStore,
  usePermissionStore,
  useMessageStore,
  useQuestionStore,
  useSessionStore,
} from "@cloudy/core-chat";

export const Route = createFileRoute("/_appMainLayout")({
  component: AppMainLayout,
});

function AppMainLayout() {
  const { isMobile, isTablet } = useDeviceType();
  const { sidebarOpen, setSidebarOpen, isDarkMode, deviceType, setDeviceType } =
    useChatUIStore();
  const [questionDialogOpen, setQuestionDialogOpen] = useState(false);
  const [permissionDialogOpen, setPermissionDialogOpen] = useState(false);
  const { loadMessages } = useMessageStore();
  const { selectedSessionId, loadSessions } = useSessionStore();
  const { loadQuestions } = useQuestionStore();
  const { loadPermissions } = usePermissionStore();
  const { selectedDirectory } = useDirectoryStore();

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

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  if (isMobile || isTablet) {
    return (
      <>
        <MobileSidebar open={sidebarOpen} onOpenChange={setSidebarOpen} />
        <div className="flex flex-col h-[100dvh] bg-background overflow-hidden">
          <PermissionBanner
            onOpenDialog={() => setPermissionDialogOpen(true)}
          />
          <QuestionBanner onOpenDialog={() => setQuestionDialogOpen(true)} />
          <Outlet />
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
        className="bg-background"
      >
        {sidebarOpen && (
          <>
            <ResizablePanel defaultSize={25} className="p-2">
              <Sidebar />
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
            <Outlet />
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
