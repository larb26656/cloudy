import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { FilesContainer } from "@/components/files/FilesContainer";
import { ErrorState } from "@/components/ui/error-state";
import { ChatContainer } from "@/components/chat/ChatContainer";
import { Center } from "@/components/layout";
import { useIsMobile } from "@/hooks/useMobile";
import { useWorkspace } from "@/hooks/queries";
import { useChatPanelStore } from "@/stores/chatPanelStore";
import { useTabStore } from "@/stores/tabStore";
import type { Tab } from "@/stores/tabStore";

interface ChatContentProps {
  tab: Extract<Tab, { type: "chat" }>;
}

export function ChatContent({ tab }: ChatContentProps) {
  const updateTabData = useTabStore((s) => s.updateTabData);
  const isMobile = useIsMobile();
  const filesOpen = useChatPanelStore(
    (s) => s.filesOpenByTabId[tab.id] ?? false,
  );
  const setFilesOpen = useChatPanelStore((s) => s.setFilesOpen);

  const { data: workspace } = useWorkspace(tab.data.workspaceId);

  if (!tab.data.directory) {
    return (
      <Center className="h-full">
        <ErrorState
          message="This chat tab has no directory and can't be opened."
          onRetry={() => useTabStore.getState().removeTab(tab.id)}
        />
      </Center>
    );
  }

  const directory = tab.data.directory;

  const chatContainer = (
    <ChatContainer
      workspace={workspace ?? null}
      directory={directory}
      sessionId={tab.data.sessionId}
      onSessionChange={(sessionId) => updateTabData(tab.id, { sessionId })}
    />
  );

  if (isMobile) {
    return (
      <div className="flex h-full flex-col">
        <div className="min-h-0 flex-1">{chatContainer}</div>
        <Sheet open={filesOpen} onOpenChange={(o) => setFilesOpen(tab.id, o)}>
          <SheetContent
            side="bottom"
            className="data-[side=bottom]:h-[95dvh] gap-0 p-0 overflow-hidden"
          >
            <SheetHeader className="sr-only">
              <SheetTitle>Files</SheetTitle>
            </SheetHeader>
            <FilesContainer directory={directory} />
          </SheetContent>
        </Sheet>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      <ResizablePanelGroup orientation="horizontal">
        <ResizablePanel defaultSize="100%" minSize="30%">
          {chatContainer}
        </ResizablePanel>
        {filesOpen && <ResizableHandle withHandle />}
        {filesOpen && (
          <ResizablePanel
            key="files"
            defaultSize="35%"
            minSize="20%"
            maxSize="70%"
          >
            <FilesContainer directory={directory} />
          </ResizablePanel>
        )}
      </ResizablePanelGroup>
    </div>
  );
}
