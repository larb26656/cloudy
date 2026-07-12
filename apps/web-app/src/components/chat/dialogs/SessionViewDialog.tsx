interface SessionViewDialogProps {
  sessionId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SessionViewDialog({
  sessionId,
  open,
  onOpenChange,
}: SessionViewDialogProps) {
  void sessionId;
  void open;
  void onOpenChange;
  return null;
}
