import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/dialog";
import { useSession } from "@/hooks/queries/useSessions";
import { MessageList } from "../message/MessageList";
import { MessageScrollerProvider } from "@repo/ui/components/message-scroller";
import { SHEET_SIZE_CLASSES } from "@/constants/sheet";
import { cn } from "@repo/ui/lib/utils";

interface SessionViewDialogProps {
  sessionId: string;
  directory?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SessionViewDialog({
  sessionId,
  directory,
  open,
  onOpenChange,
}: SessionViewDialogProps) {
  const { data: session } = useSession({ sessionId, directory });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(SHEET_SIZE_CLASSES, "p-0", "gap-0")}>
        <DialogHeader className="p-6">
          <DialogTitle>{session?.title ?? "New Chat"}</DialogTitle>
        </DialogHeader>
        <div className="flex h-full flex-col overflow-hidden">
          <MessageScrollerProvider autoScroll>
            <MessageList
              selectedSessionId={sessionId}
              directory={directory}
              isShowEmptyState={true}
            />
          </MessageScrollerProvider>
        </div>
      </DialogContent>
    </Dialog>
  );
}
