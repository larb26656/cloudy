interface PermissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PermissionDialog({ open, onOpenChange }: PermissionDialogProps) {
  void open;
  void onOpenChange;
  return null;
}
