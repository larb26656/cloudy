import { createFileRoute, Outlet } from "@tanstack/react-router";
import { Sidebar, MobileSidebar } from "@/components/layout/Sidebar";
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
import StatusBar from "@/components/StatusBar";

export const Route = createFileRoute("/_appMainLayout")({
  component: AppMainLayout,
});

const MOCK_INSTANCE_ID = "instance-mock-0001";

function AppMainLayoutContent() {
  const { isMobile, isTablet } = useDeviceType();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [questionDialogOpen, setQuestionDialogOpen] = useState(false);
  const [permissionDialogOpen, setPermissionDialogOpen] = useState(false);

  useEffect(() => {
    if (isMobile) setSidebarOpen(false);
  }, [isMobile]);

  if (isMobile || isTablet) {
    return (
      <>
        <MobileSidebar
          instanceId={MOCK_INSTANCE_ID}
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
    <>
      <div className="flex flex-col h-dvh">
        <ResizablePanelGroup
          orientation="horizontal"
          className="bg-background flex-1"
        >
          {sidebarOpen && (
            <>
              <ResizablePanel defaultSize={350} className="p-2">
                <Sidebar instanceId={MOCK_INSTANCE_ID} />
              </ResizablePanel>
              <ResizableHandle
                withHandle
                className="bg-transparent border-none"
              />
            </>
          )}
          <ResizablePanel>
            <div className="flex flex-col h-full overflow-hidden">
              <PermissionBanner
                onOpenDialog={() => setPermissionDialogOpen(true)}
              />
              <QuestionBanner onOpenDialog={() => setQuestionDialogOpen(true)} />
              <Outlet />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
        <StatusBar />
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

function AppMainLayout() {
  return <AppMainLayoutContent />;
}
