interface QuestionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QuestionDialog({ open, onOpenChange }: QuestionDialogProps) {
  void open;
  void onOpenChange;
  return null;
}
