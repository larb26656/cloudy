import { useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MessageList } from "@/components/chat/message/MessageList";
import { useStore } from "@/stores/instance";
import { cn } from "@/lib/utils";
import { SHEET_SIZE_CLASSES } from "@/constants/sheet";

type SessionViewDialogProps = {
  sessionId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function SessionViewDialog({
  sessionId,
  open,
  onOpenChange,
}: SessionViewDialogProps) {
  // TODO investigate why session is undified
  const sessionStore = useStore("session");
  const session = sessionStore.sessions.find((session) => session.id === sessionId);
  const loadMessages = useStore("message").loadMessages;

  useEffect(() => {
    if (open && sessionId) {
      loadMessages(sessionId);
    }
  }, [open, sessionId, loadMessages]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn("flex flex-col p-0 gap-0", SHEET_SIZE_CLASSES)}
      >
        <DialogHeader className="p-4 flex-none">
          <DialogTitle>{session?.title ?? "Session"}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 flex flex-col overflow-hidden">
          <MessageList
            selectedSessionId={sessionId}
            isShowEmptyState={false}
            showShadowEdge={false}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
