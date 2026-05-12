import { createFileRoute, Navigate, Outlet } from "@tanstack/react-router";
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
import { useChatUIStore } from "@/stores/chatUIStore";
import { useEffect, useState } from "react";
import { useStore } from "@/hooks/instanceScopeHook";
import { useInstanceStore } from "@/stores/instanceStore";
import { useWorkspaceStore } from "@/stores/workspaceStore";

export const Route = createFileRoute("/_appMainLayout")({
  component: AppMainLayout,
});

interface AppMainLayoutContentProps {
  activeInstanceId: string;
}

function AppMainLayoutContent({ activeInstanceId }: AppMainLayoutContentProps) {
  const { isMobile, isTablet } = useDeviceType();
  const { sidebarOpen, setSidebarOpen } = useChatUIStore();
  const [questionDialogOpen, setQuestionDialogOpen] = useState(false);
  const [permissionDialogOpen, setPermissionDialogOpen] = useState(false);

  const selectedDirectory =
    useWorkspaceStore().getCurrentWorkspace()?.directory;
  const loadSessions = useStore(
    "session",
    (s) => s.loadSessions,
    activeInstanceId,
  );
  const loadQuestions = useStore(
    "question",
    (s) => s.loadQuestions,
    activeInstanceId,
  );
  const loadPermissions = useStore(
    "permission",
    (s) => s.loadPermissions,
    activeInstanceId,
  );

  useEffect(() => {
    if (selectedDirectory) {
      loadSessions(selectedDirectory);
      loadQuestions(selectedDirectory);
      loadPermissions(selectedDirectory);
    }
  }, [selectedDirectory, loadSessions, loadQuestions, loadPermissions]);

  if (isMobile || isTablet) {
    return (
      <>
        <MobileSidebar
          instanceId={activeInstanceId}
          open={sidebarOpen}
          onOpenChange={setSidebarOpen}
        />
        <div className="flex flex-col h-dvh bg-background overflow-hidden">
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
    <div className="h-dvh">
      <ResizablePanelGroup orientation="horizontal" className="bg-background">
        {sidebarOpen && (
          <>
            <ResizablePanel defaultSize={25} className="p-2">
              <Sidebar instanceId={activeInstanceId} />
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

function AppMainLayout() {
  const { isDarkMode, deviceType, setDeviceType } = useChatUIStore();
  const { instances } = useInstanceStore();
  const { workspaces } = useWorkspaceStore();
  const isHaveToOnboard = instances.length === 0 || workspaces.length === 0;
  const activeInstanceId = useInstanceStore((s) => s.instances[0]?.id);

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

  if (isHaveToOnboard) {
    return <Navigate to="/onboard" />;
  }

  return <AppMainLayoutContent activeInstanceId={activeInstanceId!} />;
}
