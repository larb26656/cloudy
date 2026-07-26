import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useSession } from "@/hooks/queries/useSessions";
import { MessageList } from "../message/MessageList";
import { SHEET_SIZE_CLASSES } from "@/constants/sheet";
import { cn } from "@/lib/utils";

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
      <DialogContent className={cn(SHEET_SIZE_CLASSES)}>
        <DialogHeader>
          <DialogTitle>{session?.title ?? "New Chat"}</DialogTitle>
        </DialogHeader>
        <MessageList
          selectedSessionId={sessionId}
          directory={directory}
          isShowEmptyState={true}
        />
      </DialogContent>
    </Dialog>
  );
}
